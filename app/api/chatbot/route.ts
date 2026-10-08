import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Import workflow and credential actions
import { getWorkflowsForUser } from '@/actions/workflows/get-workflows-for-user';
import { createWorkflow } from '@/actions/workflows/create-workflow';
import { updateWorkflow } from '@/actions/workflows/update-workflow';
import { runWorkflow } from '@/actions/workflows/run-workflow';
import { WorkflowExecutionTrigger } from '@/types/workflow';
import { buildDefinitionFromAiSpec } from '@/lib/workflow/ai-automation';
import { GENERAL_CHAT_SESSION_ID } from '@/lib/chat/constants';
import { reserveChatRequest } from '@/lib/chat/rate-limit';
import {
  buildBoundedHistory,
  buildSystemPrompt,
  buildWorkflowContextHeader,
  MAX_CHAT_MESSAGES,
  MAX_CHAT_MESSAGE_CHARS,
  MAX_WORKFLOW_CONTEXT_CHARS,
} from '@/lib/chat/prompt';
import { extractAutomationSpec } from '@/lib/chat/automation-response';
import { waitForExecutionAndSummarize } from '@/lib/chat/execution-summary';

// Initialize Google Generative AI
if (!process.env.GOOGLE_API_KEY) {
  console.error("FATAL: GOOGLE_API_KEY is not set in .env. Chatbot API cannot initialize.");
}

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-3.8-flash';
export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_API_KEY) {
    console.error('Chatbot API called, but GOOGLE_API_KEY is missing.');
    return new NextResponse('Server configuration error: Chatbot is not configured.', { status: 500 });
  }

  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { message, workflowId: clientWorkflowId, currentDefinition } = await req.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new NextResponse('Message is required', { status: 400 });
    }
    if (message.length > MAX_CHAT_MESSAGE_CHARS) {
      return new NextResponse('Message is too large', { status: 413 });
    }
    if (currentDefinition !== undefined && typeof currentDefinition !== 'string') {
      return new NextResponse('Invalid workflow context', { status: 400 });
    }
    if (currentDefinition && currentDefinition.length > MAX_WORKFLOW_CONTEXT_CHARS) {
      return new NextResponse('Workflow context is too large', { status: 413 });
    }

    try {
      if (!await reserveChatRequest(userId)) {
        return new NextResponse('Too many chatbot requests. Try again shortly.', { status: 429 });
      }
    } catch (error) {
      console.error('Chatbot rate limiter unavailable:', error);
      return new NextResponse('Chatbot temporarily unavailable', { status: 503 });
    }

    const effectiveWorkflowId = clientWorkflowId || GENERAL_CHAT_SESSION_ID;

    // Retrieve user's chat session history
    let chatSession = await prisma.chatSession.findUnique({
      where: {
        userId_workflowId: {
          userId: userId,
          workflowId: effectiveWorkflowId,
        }
      },
    });

    let messages: { role: 'user' | 'model' | string; parts: { text: string }[] }[] = [];

    if (chatSession && Array.isArray(chatSession.messages)) {
      messages = (chatSession.messages as { role: string; parts: { text: string }[] }[]).map(msg => ({
        ...msg,
        role: msg.role === 'assistant' ? 'model' : msg.role,
      }));
    }

    messages.push({ role: 'user', parts: [{ text: message }] });
    if (messages.length > MAX_CHAT_MESSAGES) {
      messages = messages.slice(-MAX_CHAT_MESSAGES);
    }

    let workflowContextHeader = '';
    if (clientWorkflowId && clientWorkflowId !== GENERAL_CHAT_SESSION_ID) {
      const currentWorkflow = await prisma.workflow.findUnique({
        where: { id: clientWorkflowId, userId },
        select: { name: true, description: true, definition: true },
      });

      if (currentWorkflow || currentDefinition) {
        workflowContextHeader = buildWorkflowContextHeader({
          name: currentWorkflow?.name,
          description: currentWorkflow?.description,
          definition: currentDefinition || currentWorkflow?.definition,
        });
      }
    }

    const finalSystemPrompt = buildSystemPrompt(workflowContextHeader);

    const boundedHistory = buildBoundedHistory(messages.slice(0, -1));

    const response = await genAI.models.generateContent({
      model: CHAT_MODEL,
      contents: `${boundedHistory ? `Conversation history:\n${boundedHistory}\n\n` : ''}User: ${message}`,
      config: {
        systemInstruction: finalSystemPrompt,
        maxOutputTokens: 2048,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ],
      },
    });

    let text = response.text || '';

    const automationSpec = extractAutomationSpec(text);

    let automationSummary: string | null = null;
    if (automationSpec && Array.isArray(automationSpec.workflow.nodes)) {
      try {
        const definition = buildDefinitionFromAiSpec(automationSpec);
        const shouldRun = (automationSpec.action || '').includes('RUN');

        if (
          clientWorkflowId &&
          (automationSpec.action === 'UPDATE_ONLY' || automationSpec.action === 'UPDATE_AND_RUN')
        ) {
          await updateWorkflow({ id: clientWorkflowId, definition });
          if (shouldRun) {
            const execution = await runWorkflow({
              workflowId: clientWorkflowId,
              trigger: WorkflowExecutionTrigger.MANUAL,
              shouldRedirect: false,
              currentFlowDefinition: definition,
            });
            const execResult = await waitForExecutionAndSummarize(execution.id);
            automationSummary =
              `Workflow updated and ${execResult.status === 'TIMEOUT' ? 'run started (await timeout)' : 'run completed'} for current workflow. Execution ID: ${execution.id}\n${execResult.summary}`;
          } else {
            automationSummary = 'Workflow updated for current workflow.';
          }
        } else {
          const name = automationSpec.workflow.name || `AI Workflow ${new Date().toISOString()}`;
          const description = automationSpec.workflow.description || undefined;
          const newWorkflow = await createWorkflow(name, definition, description, false);

          if (shouldRun) {
            const execution = await runWorkflow({
              workflowId: newWorkflow.id,
              trigger: WorkflowExecutionTrigger.MANUAL,
              shouldRedirect: false,
            });
            const execResult = await waitForExecutionAndSummarize(execution.id);
            automationSummary =
              `Workflow created (ID: ${newWorkflow.id}) and ${execResult.status === 'TIMEOUT' ? 'run started (await timeout)' : 'run completed'}. Execution ID: ${execution.id}\n${execResult.summary}`;
          } else {
            automationSummary = `Workflow created successfully. ID: ${newWorkflow.id}`;
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        automationSummary = `Failed to process AI automation spec: ${errorMessage}`;
      }
    }

    if (automationSummary) {
      text = automationSummary;
    }
    else if (message.toLowerCase().includes('list workflows') || text.toLowerCase().includes("call `getworkflowsforuser()`")) {
      const workflows = await getWorkflowsForUser();
      text = `Here are your existing workflows:\n${workflows.map((w: any) => `- ${w.name} (ID: ${w.id})`).join('\n') || 'No workflows found.'}`;
    }
    else if (message.toLowerCase().includes('run workflow')) {
      const idMatch = message.match(/run workflow with id\s+([a-zA-Z0-9_-]+)/i);
      const nameMatch = message.match(/run workflow named\s+"([^"]+)"/i);

      let workflowIdToRun: string | null = null;

      if (idMatch) {
        workflowIdToRun = (idMatch[1] !== undefined) ? (idMatch[1] as string) : null;
      } else if (nameMatch) {
        const workflows = await getWorkflowsForUser();
        const foundWorkflow = workflows.find((w: any) => w.name.toLowerCase() === nameMatch[1].toLowerCase());
        workflowIdToRun = (foundWorkflow && foundWorkflow.id !== undefined) ? (foundWorkflow.id as string) : null;
      }

      if (workflowIdToRun !== null) {
        try {
          const execution = await runWorkflow({
            workflowId: workflowIdToRun,
            trigger: WorkflowExecutionTrigger.MANUAL,
            shouldRedirect: false,
          });
          text = `Workflow (ID: ${workflowIdToRun}) started successfully! Execution ID: ${execution.id}`;
        } catch (error: any) {
          text = `Failed to run workflow (ID: ${workflowIdToRun}): ${error.message || 'Unknown error'}`;
        }
      } else {
        text = "To run a workflow, please specify its ID (e.g., 'run workflow with id abc123xyz') or its name (e.g., 'run workflow named \"My Workflow\"').";
      }
    }

    messages.push({ role: 'model', parts: [{ text }] });

    await prisma.chatSession.upsert({
      where: {
        userId_workflowId: {
          userId: userId,
          workflowId: effectiveWorkflowId,
        }
      },
      update: { messages, lastActiveAt: new Date() },
      create: { userId, workflowId: effectiveWorkflowId, messages, lastActiveAt: new Date() },
    });

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Chatbot API error:', error);
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
}
