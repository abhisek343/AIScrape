import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { TaskParam } from '@/types/task';

// Import workflow and credential actions
import { getWorkflowsForUser } from '@/actions/workflows/get-workflows-for-user';
import { createWorkflow } from '@/actions/workflows/create-workflow';
import { updateWorkflow } from '@/actions/workflows/update-workflow';
import { runWorkflow } from '@/actions/workflows/run-workflow';
import { WorkflowExecutionTrigger, WorkflowExecutionStatus } from '@/types/workflow';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { AiAutomationSpec, buildDefinitionFromAiSpec } from '@/lib/workflow/ai-automation';
import { flowToExecutionPlan, FlowToExecutionPlanValidationError } from '@/lib/workflow/execution-plan';
import { AppNode } from '@/types/appnode';
import { GENERAL_CHAT_PLACEHOLDER, hasExplicitAutomationIntent } from '@/lib/chatbot/constants';

// Initialize Google Generative AI
if (!process.env.GOOGLE_API_KEY) {
  console.error("FATAL: GOOGLE_API_KEY is not set in .env. Chatbot API cannot initialize.");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Helpers for automation and awaiting runs
async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractFirstJsonBlock(text: string): string | null {
  // Prefer fenced ```json blocks
  const fenceMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }
  // Fallback: try to find the first top-level JSON object
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1);
    return candidate;
  }
  return null;
}

function safeJsonParse<T = any>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

async function waitForExecutionAndSummarize(executionId: string, timeoutMs = 8_000) {
  const start = Date.now();
  const POLL_INTERVAL = 800;
  const MAX_ITERATIONS = Math.ceil(timeoutMs / POLL_INTERVAL);

  const TERMINAL_STATES = [
    WorkflowExecutionStatus.COMPLETED,
    WorkflowExecutionStatus.FAILED,
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const exec = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        phases: { orderBy: { number: 'asc' }, include: { logs: true } },
      },
    });

    if (!exec) return { status: 'NOT_FOUND', summary: 'Execution not found.' } as const;

    if (TERMINAL_STATES.includes(exec.status as WorkflowExecutionStatus)) {
      const outputs = (exec.phases || []).map((p: { outputs: string | null; name: string }, idx: number) => {
        let out: Record<string, unknown> = {};
        try {
          out = p.outputs ? JSON.parse(p.outputs) : {};
        } catch { /* empty */ }
        return { phase: idx + 1, name: p.name, outputs: out };
      });
      const last = outputs[outputs.length - 1];
      const lastOutSummary = last && Object.keys(last.outputs || {}).length
        ? JSON.stringify(last.outputs)
        : '(no outputs)';
      const overall = `Run ${String(exec.status).toLowerCase()}. Credits consumed: ${exec.creditsConsumed}.`;
      const phases = outputs
        .map((o: { phase: number; name: string; outputs: Record<string, unknown> }) => `Phase ${o.phase} - ${o.name}: ${JSON.stringify(o.outputs) || '{}'}`)
        .join('\n');
      return { status: exec.status, summary: `${overall}\nLast phase outputs: ${lastOutSummary}\n\nAll phase outputs:\n${phases}` } as const;
    }

    if (Date.now() - start > timeoutMs) {
      return { status: 'TIMEOUT', summary: 'The run is still in progress. Check runs page for live status.' } as const;
    }

    await wait(POLL_INTERVAL);
  }

  return { status: 'TIMEOUT', summary: 'The run is still in progress. Check runs page for live status.' } as const;
}

function analyzeWorkflowIssues(definition: string): string[] {
  try {
    const def = JSON.parse(definition);
    const nodes = Array.isArray(def?.nodes) ? def.nodes as AppNode[] : [];
    const edges = Array.isArray(def?.edges) ? def.edges : [];

    if (nodes.length === 0) {
      return ["Empty workflow: No nodes added yet. Start by dragging a 'Launch Browser' node from the sidebar."];
    }

    const { error } = flowToExecutionPlan(nodes, edges);
    const issues: string[] = [];

    if (error?.type === FlowToExecutionPlanValidationError.NO_ENTRY_POINT) {
      issues.push("Missing entry point: Add a 'Launch Browser' node to start the workflow. This node must be the first step.");
    }

    if (error?.type === FlowToExecutionPlanValidationError.INVALID_INPUTS && error.invalidElements) {
      for (const elem of error.invalidElements) {
        const node = nodes.find((n) => n.id === elem.nodeId);
        const nodeType = node?.data?.type;
        const taskDef = nodeType ? TaskRegistry[nodeType as keyof typeof TaskRegistry] : undefined;
        const nodeLabel = taskDef?.label || nodeType || 'Unknown node';
        const inputsList = elem.inputs.join(', ');
        if (elem.inputs.includes('Node is not reachable') || elem.inputs.includes('cycle')) {
          issues.push(`'${nodeLabel}' is disconnected: Connect it to the main workflow flow with edges.`);
        } else {
          issues.push(`'${nodeLabel}' has missing inputs: ${inputsList}. Either fill in the value directly or connect an edge from another node's output.`);
        }
      }
    }

    return issues;
  } catch (e) {
    console.debug('analyzeWorkflowIssues failed:', e);
    return [];
  }
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!process.env.GOOGLE_API_KEY) {
    console.error('Chatbot API called, but GOOGLE_API_KEY is missing.');
    return new NextResponse('Server configuration error: Chatbot is not configured.', { status: 500 });
  }

  try {
    const { message, workflowId: clientWorkflowId, currentDefinition } = await req.json();

    if (!message) {
      return new NextResponse('Message is required', { status: 400 });
    }

    const effectiveWorkflowId = clientWorkflowId || GENERAL_CHAT_PLACEHOLDER;

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

    let systemPrompt = `
      You are an **Expert Automation Architect** for AIScrape.
      
      **Personality & Style**:
      - Treat the user as a colleague. Be concise, technical, and helpful.
      - **ALWAYS use Markdown** for rich formatting.
      
      **Scope**:
      - Only discuss AIScrape, web scraping, and automation.
      - Politely decline any off-topic or harmful requests.
      - Automation is OFF by default. Only return executable automation JSON when the user explicitly asks to automate/create/update/run a workflow.
    `;

    const DetailedDescriptions: Record<string, string> = {
      LAUNCH_BROWSER: 'Opens a fresh, automated browser and points it at the first URL.',
      NAVIGATE_URL: 'Directs the current browser tab to a new address.',
      PAGE_TO_HTML: 'Grabs the full HTML snapshot of the current page.',
      CLICK_ELEMENT: 'Finds a clickable thing on the page and presses it.',
      FILL_INPUT: 'Targets an input field and types the provided value.',
      WAIT_FOR_ELEMENT: 'Pauses until a specific element is visible or hidden.',
      EXTRACT_TEXT_FROM_ELEMENT: 'Plucks the human-readable text from elements.',
      EXTRACT_DATA_WITH_AI: 'Reads raw text or HTML and asks an AI to return structured results.',
      DELIVER_VIA_WEBHOOK: 'Ships your collected data to an external system.',
      SCREENSHOT: 'Captures a pixel-perfect image of the full page or element.',
    };

    function buildAvailableNodesDescription(): string {
      const lines: string[] = [];
      for (const [type, task] of Object.entries(TaskRegistry)) {
        const dataInputs = (task.inputs || []).filter((p: TaskParam) => p.hideHandle);
        const edgeInputs = (task.inputs || []).filter((p: TaskParam) => !p.hideHandle);
        const outputs = task.outputs || [];
        const desc = DetailedDescriptions[type as keyof typeof DetailedDescriptions] || `${task.label} node.`;
        const parts: string[] = [];
        parts.push(`- ${type} (${task.label}): ${desc}`);
        if (task.isEntryPoint) parts.push(`Entry point: Yes.`);
        if (typeof task.credits === 'number') parts.push(`Credits: ${task.credits}.`);
        if (dataInputs.length > 0) {
          parts.push(`Node Data Inputs: ${dataInputs.map((i: TaskParam) => `${i.name}`).join(', ')}.`);
        }
        if (edgeInputs.length > 0) {
          parts.push(`Edge Inputs: ${edgeInputs.map((i: TaskParam) => `${i.name}`).join(', ')}.`);
        }
        if (outputs.length > 0) {
          parts.push(`Outputs: ${outputs.map((o: TaskParam) => `${o.name}`).join(', ')}.`);
        }
        lines.push(parts.join(' '));
      }
      return lines.join('\n            ');
    }

    const availableNodesDescription = buildAvailableNodesDescription();

    let workflowContextHeader = "";
    if (clientWorkflowId && clientWorkflowId !== GENERAL_CHAT_PLACEHOLDER) {
      const currentWorkflow = await prisma.workflow.findUnique({
        where: { id: clientWorkflowId, userId: userId },
        select: { name: true, description: true, definition: true }
      });
      if (currentWorkflow || currentDefinition) {
        let narrative = '';
        try {
          const defStr = currentDefinition || currentWorkflow?.definition;
          const def = defStr ? JSON.parse(defStr) : null;
          const nodes = Array.isArray(def?.nodes) ? def.nodes : [];
          if (nodes.length > 0) {
            const steps: string[] = [];
            for (const node of nodes) {
              const nodeType: string | undefined = node?.data?.type;
              const reg = nodeType ? TaskRegistry[nodeType as keyof typeof TaskRegistry] : undefined;
              const label = reg?.label || nodeType || 'Unknown';
              const inputs = node?.data?.inputs || {};
              const inputPairs = Object.entries(inputs).map(([k, v]) => `${k}: ${String(v)}`);
              const desc = nodeType && DetailedDescriptions[nodeType] ? DetailedDescriptions[nodeType] : '';
              const line = inputPairs.length > 0
                ? `${label} (${nodeType}). ${desc} Inputs: ${inputPairs.join(', ')}.`
                : `${label} (${nodeType}). ${desc}`;
              steps.push(line.trim());
            }
            narrative = `Current workflow state:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
          }
        } catch { }
        const wfName = currentWorkflow?.name || "Untitled Workflow";
        const wfDesc = currentWorkflow?.description || 'No description';

        const defStr = currentDefinition || currentWorkflow?.definition;
        let issuesContext = '';
        if (defStr) {
          const issues = analyzeWorkflowIssues(defStr);
          if (issues.length > 0) {
            issuesContext = `\n\n**CURRENT ISSUES DETECTED IN WORKFLOW:**\n${issues.map((issue, idx) => `${idx + 1}. ${issue}`).join('\n')}`;
          }
        }

        workflowContextHeader = `The user is currently working on a workflow named "${wfName}". Description: "${wfDesc}". ${narrative ? `\n\n${narrative}\n\n` : ''}${issuesContext}\n\nTailor your guidance to this specific workflow if the question seems related to it.\n\n`;
      }
    }

    systemPrompt += `

You are an AI assistant for AIScrape, a SaaS platform for web scraping and workflow automation.
Your primary role is to provide information and guidance to users on how to use the platform and its features.
You have knowledge of the following available workflow nodes:
${availableNodesDescription}

Maintain a helpful, safe, and project-focused conversation.
    `;

    const finalSystemPrompt = workflowContextHeader + systemPrompt;

    // Initialize Gemini model with safety settings
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Send to model
    const chat = model.startChat({
      history: messages.slice(0, -1),
    });

    const result = await chat.sendMessage(finalSystemPrompt + '\n\nUser: ' + message);
    const response = result.response;
    let text = response.text();

    // Enhanced detection: Check for JSON block
    const jsonBlock = extractFirstJsonBlock(text);
    let automationSpec: AiAutomationSpec | null = null;

    if (jsonBlock) {
      const parsed = safeJsonParse<AiAutomationSpec>(jsonBlock);
      if (parsed && parsed.action && parsed.workflow) {
        automationSpec = parsed;
      }
    }

    let automationSummary: string | null = null;
    const automationRequested = hasExplicitAutomationIntent(message);
    if (automationSpec && automationRequested) {
      if (jsonBlock) {
        const spec = safeJsonParse<AiAutomationSpec>(jsonBlock);
        if (spec && spec.workflow && Array.isArray(spec.workflow.nodes)) {
          try {
            const definition = buildDefinitionFromAiSpec(spec);
            const shouldRun = (spec.action || '').includes('RUN');

            if (clientWorkflowId && (spec.action === 'UPDATE_ONLY' || spec.action === 'UPDATE_AND_RUN')) {
              await updateWorkflow({ id: clientWorkflowId, definition });
              if (shouldRun) {
                const execution = await runWorkflow({ workflowId: clientWorkflowId, trigger: WorkflowExecutionTrigger.MANUAL, shouldRedirect: false, currentFlowDefinition: definition });
                const execResult = await waitForExecutionAndSummarize(execution.id);
                automationSummary = `Workflow updated and ${execResult.status === 'TIMEOUT' ? 'run started (await timeout)' : 'run completed'} for current workflow. Execution ID: ${execution.id}\n${execResult.summary}`;
              } else {
                automationSummary = `Workflow updated for current workflow.`;
              }
            } else {
              const name = spec.workflow.name || `AI Workflow ${new Date().toISOString()}`;
              const description = spec.workflow.description || undefined;
              const newWorkflow = await createWorkflow(name, definition, description, false);
              if (shouldRun) {
                const execution = await runWorkflow({ workflowId: newWorkflow.id, trigger: WorkflowExecutionTrigger.MANUAL, shouldRedirect: false });
                const execResult = await waitForExecutionAndSummarize(execution.id);
                automationSummary = `Workflow created (ID: ${newWorkflow.id}) and ${execResult.status === 'TIMEOUT' ? 'run started (await timeout)' : 'run completed'}. Execution ID: ${execution.id}\n${execResult.summary}`;
              } else {
                automationSummary = `Workflow created successfully. ID: ${newWorkflow.id}`;
              }
            }
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            automationSummary = `Failed to process AI automation spec: ${errorMsg}`;
          }
        }
      }
    }
    else if (automationSpec && !automationRequested) {
      text = "Automation mode is off by default, so no workflow was created, updated, or run. If you want execution, explicitly say: \"automation on\", \"automate\", \"create a workflow\", or \"update the workflow\".";
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
    console.error('Chatbot API error FULL DETAILS:', error);
    // @ts-ignore
    if (error.response) {
      // @ts-ignore
      console.error('Chatbot API error Response:', await error.response.text());
    }
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
}
