import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'; // Updated import
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Import workflow and credential actions
import { getWorkflowsForUser } from '@/actions/workflows/get-workflows-for-user';
import { createWorkflow } from '@/actions/workflows/create-workflow';
import { runWorkflow } from '@/actions/workflows/run-workflow';
import { getCredentialsForUser } from '@/actions/credentials/get-credentials-for-user';
import { Workflow, WorkflowExecution, Credential } from '@prisma/client'; // Import types from Prisma Client
import { WorkflowExecutionTrigger } from '@/types/workflow'; // Import WorkflowExecutionTrigger

// Initialize Google Generative AI
if (!process.env.GOOGLE_API_KEY) {
  console.error("FATAL: GOOGLE_API_KEY is not set in .env. Chatbot API cannot initialize.");
  // This error will be thrown when the module is loaded if the key is missing.
  // For a per-request check, it would need to be inside POST, but genAI is module-scoped.
  // Better to ensure it's set, or the app shouldn't start/deploy properly.
  // For now, let this be a module-load time check.
  // throw new Error("Server configuration error: Missing Google API Key for Chatbot.");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || ""); // Provide default empty string if null/undefined to satisfy constructor, error will be caught by SDK if key is invalid/empty during API call.

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_API_KEY) {
    console.error('Chatbot API called, but GOOGLE_API_KEY is missing.');
    return new NextResponse('Server configuration error: Chatbot is not configured.', { status: 500 });
  }

  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Mode is no longer sent from client, AI will infer intent.
  // workflowId is now expected from the client if in a workflow context
  const { message, workflowId: clientWorkflowId } = await req.json(); // Renamed to avoid conflict

  if (!message) {
    return new NextResponse('Message is required', { status: 400 });
  }

  const GENERAL_CHAT_PLACEHOLDER = '___GENERAL_CHAT_SESSION___';
  const effectiveWorkflowId = clientWorkflowId || GENERAL_CHAT_PLACEHOLDER;

  try {
    // Retrieve user's chat session history, now context-aware with workflowId
    let chatSession = await prisma.chatSession.findUnique({
      where: {
        userId_workflowId: {
          userId: userId,
          workflowId: effectiveWorkflowId,
        }
      },
    });

    let messages: { role: 'user' | 'model'; parts: { text: string }[] }[] = []; // Typed roles

    if (chatSession && Array.isArray(chatSession.messages)) {
      // Ensure history messages use 'model' for assistant role
      messages = (chatSession.messages as any[]).map(msg => ({
        ...msg,
        role: msg.role === 'assistant' ? 'model' : msg.role,
      }));
    }

    // Add the new user message
    messages.push({ role: 'user', parts: [{ text: message }] });

    // Construct the system prompt based on the mode and project context
    let systemPrompt = `
      You are a helpful and safe AI assistant for the AIScrape SaaS platform. Your purpose is to assist users with web scraping, data extraction, and workflow automation. You must only discuss topics related to the AIScrape SaaS project and its functionalities.
      Your responses should be clear, concise, and user-friendly, delivered in plain text without any markdown formatting (e.g., no bolding with asterisks, no code blocks with backticks, no lists with hyphens/bullets). Focus on direct answers and helpful guidance.
      
      Based on the user's message, you must determine the intent:
      1.  **Information/Planning**: If the user is asking for information, explanations, or help planning a workflow, provide a helpful and informative response. You can describe workflow components and how they might be used.
      2.  **Action-Oriented**: If the user is asking to perform an action (e.g., "create a workflow to...", "list my workflows", "show my credentials"), then you should proceed to take that action or guide the user through it.

      Under no circumstances should you generate, engage with, or respond to any content that is sexually explicit, hateful, harmful, or otherwise inappropriate. If a user attempts to ask about such topics, politely decline and redirect the conversation back to the project's scope.
    `;
    
    // Define available workflow node types for the AI to use, matching TaskRegistry keys
    const availableNodes = [
      { 
        type: "LAUNCH_BROWSER", 
        description: "Launches a new browser session. The 'Website Url' is a required data input for the node. 'headless' (boolean, optional) and 'proxy' (string, optional) can also be provided in the node's data. Often the first step for web interactions.", 
        dataInputs: ["Website Url (string, required for node data)", "headless (boolean, optional for node data)", "proxy (string, optional for node data)"], 
        inputs: [], // No direct edge inputs, 'Website Url' is part of node data
        outputs: ["Web page"], 
        isEntryPoint: true 
      },
      { 
        type: "NAVIGATE_URL", 
        description: "Navigates the browser to a specific URL. Requires an active browser session ('Web page' input) and a 'URL' to navigate to.", 
        inputs: ["Web page", "URL"], 
        outputs: ["Web page"] 
      },
      { 
        type: "PAGE_TO_HTML", 
        description: "Extracts the full HTML content of the current page. Requires an active browser session ('Web page' input).", 
        inputs: ["Web page"], 
        outputs: ["Html", "Web page"] 
      },
      { 
        type: "CLICK_ELEMENT", 
        description: "Clicks on a specific element on a webpage. Requires an active browser session ('Web page' input) and a CSS 'Selector' for the element.", 
        inputs: ["Web page", "Selector"], 
        outputs: ["Web page"] 
      },
      { 
        type: "FILL_INPUT", 
        description: "Fills an input field on a webpage. Requires an active browser session ('Web page' input), a CSS 'Selector' for the input field, and the 'Value' to fill.", 
        inputs: ["Web page", "Selector", "Value"], 
        outputs: ["Web page"] 
      },
      { 
        type: "WAIT_FOR_ELEMENT", 
        description: "Waits for a specific element to appear or become hidden on the page. Requires an active browser session ('Web page' input) and a CSS 'Selector'. 'Visibility' ('visible' or 'hidden') is a required data input for the node.", 
        inputs: ["Web page", "Selector"], 
        dataInputs: ["Visibility (string, required for node data: 'visible' or 'hidden')"],
        outputs: ["Web page"] 
      },
      { 
        type: "SCROLL_TO_ELEMENT", 
        description: "Scrolls the page to a specific element. Requires an active browser session ('Web page' input) and a CSS 'Selector'.", 
        inputs: ["Web page", "Selector"], 
        outputs: ["Web page"] 
      },
      { 
        type: "EXTRACT_TEXT_FROM_ELEMENT", 
        description: "Extracts text content from a specific HTML element. Requires 'Html' content (usually from PAGE_TO_HTML) and a CSS 'Selector'.", 
        inputs: ["Html", "Selector"], 
        outputs: ["Extracted text"] 
      },
      { 
        type: "EXTRACT_DATA_WITH_AI", 
        description: "Extracts structured data from text/HTML using AI. Requires 'Content' (text or HTML), 'Credentials' for the AI provider, and a 'Prompt' describing the extraction task.", 
        inputs: ["Content", "Credentials", "Prompt"], 
        outputs: ["Extracted data"] 
      },
      { 
        type: "READ_PROPERTY_FROM_JSON", 
        description: "Reads a value from a JSON string/object using a 'Property name' (e.g., 'data.user.name' or a simple key).", 
        inputs: ["JSON", "Property name"], 
        outputs: ["Property value"] 
      },
      { 
        type: "ADD_PROPERTY_TO_JSON", 
        description: "Adds a new key-value pair to a JSON string/object. Requires the 'JSON' string, the 'Property name' (key), and the 'Property value'.", 
        inputs: ["JSON", "Property name", "Property value"], 
        outputs: ["Updated JSON"] 
      },
      { 
        type: "DELIVER_VIA_WEBHOOK", 
        description: "Sends data to a specified webhook URL. Requires the 'Target URL' and the 'Body' (data to send, usually a JSON string).", 
        inputs: ["Target URL", "Body"], 
        outputs: [] // No outputs for edges
      }
    ];

// Unified prompt section for AI capabilities (planning and acting)

    let workflowContextHeader = "";
    if (clientWorkflowId && clientWorkflowId !== GENERAL_CHAT_PLACEHOLDER) { // Check if it's a specific workflow
      const currentWorkflow = await prisma.workflow.findUnique({
        where: { id: clientWorkflowId, userId: userId }, // Ensure user owns the workflow
        select: { name: true, description: true }
      });
      if (currentWorkflow) {
        workflowContextHeader = `The user is currently working on a workflow named "${currentWorkflow.name}". Description: "${currentWorkflow.description || 'No description'}". Tailor your guidance to this specific workflow if the question seems related to it.\n\n`;
      }
    }

    const availableNodesDescription = availableNodes.map(node => {
      let parts = [`- ${node.type}: ${node.description}`];
      if (node.dataInputs && node.dataInputs.length > 0) {
        parts.push(`Node Data Inputs: ${node.dataInputs.join(', ')}.`);
      }
      if (node.inputs && node.inputs.length > 0) {
        parts.push(`Edge Inputs: ${node.inputs.join(', ')}.`);
      }
      if (node.outputs && node.outputs.length > 0) {
        parts.push(`Outputs: ${node.outputs.join(', ')}.`);
      }
      return parts.join(' ');
    }).join('\n            ');

    systemPrompt += `

You are an AI assistant for AIScrape, a SaaS platform for web scraping and workflow automation.
Your primary role is to provide information and guidance to users on how to use the platform and its features, especially the workflow editor.
You have knowledge of the following available workflow nodes:
${availableNodesDescription}

When a user asks how to achieve a task (e.g., "how do I extract data from LinkedIn?"):
1. Understand their goal.
2. Suggest a sequence of the available nodes that could accomplish this.
3. Explain what each node in your suggested sequence does and why it's useful for their goal.
4. **To visually represent the suggested workflow, generate a Mermaid flowchart diagram (using \`graph TD;\` or \`graph LR;\`). Enclose the Mermaid code in a Markdown code block like this: \`\`\`mermaid\ngraph TD;\n  A[Node 1 Title] --> B(Node 2 Title);\n  B --> C{Decision?};\n  C -- Yes --> D[End];\n  C -- No --> E[Alternative Step];\n\`\`\` Replace node IDs (A, B, C) and titles with meaningful representations of the workflow steps. Ensure the diagram clearly shows the flow between the suggested nodes.**
5. You DO NOT create or attempt to create workflows. Your purpose is to guide the user so they can build the workflow themselves in the editor, using your textual explanation and the Mermaid diagram as aids.

Your entire response, including any Mermaid code block, should be a single plain text string. The frontend will handle rendering the diagram.

If the user asks to list their workflows or credentials, the system will handle this if you indicate that action.
You DO NOT run workflows; guide the user to do this manually.

Maintain a helpful, safe, and project-focused conversation.
    `;
    
    const finalSystemPrompt = workflowContextHeader + systemPrompt;

    // Prepare the contents for the model - system prompt is prepended as a user message
    const preparedContents = [{ role: 'user' as const, parts: [{ text: finalSystemPrompt }] }, ...messages];

    // Get the generative model
    const generativeModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash", // Updated model
      // Optional: Add safety settings if needed, matching typical Gemini configurations
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

    // Send the latest user message to the model
    const result = await generativeModel.generateContent({
      contents: preparedContents,
      // generationConfig: { // Optional: if you need to control output, e.g., max tokens
      //   maxOutputTokens: 2048,
      // }
    });
    const response = result.response;
    let text = response.text(); // Correct way to get text

    // AI no longer creates workflows directly. The regex and related logic are removed.
    // const aiCreateWorkflowRegex = /createWorkflow\("([^"]+)",\s*\`([\s\S]+?)\`,\s*"([^"]*)",\s*false\)/;
    // const aiMatch = text.match(aiCreateWorkflowRegex);
    // let workflowCreatedOrAttemptedByAI = false; // This variable is no longer needed.

    // if (aiMatch) {
      // workflowCreatedOrAttemptedByAI = true; // This variable is no longer needed.
      // const [, workflowName, workflowDefinitionJson, workflowDescription] = aiMatch;
      // try {
      //   console.log(`AI initiated workflow creation: Name: ${workflowName}`);
      //   const newWorkflow = await createWorkflow(
      //     workflowName,
      //     workflowDefinitionJson,
      //     workflowDescription || undefined,
      //     false
      //   );
      //   console.log(`AI successfully created workflow: ${newWorkflow.id}`);
      // } catch (error: any) {
      //   console.error("Error actually creating workflow from AI's plan:", error);
      //   text = `I tried to create the workflow "${workflowName}" as per my understanding, but an error occurred: ${error.message || 'Unknown error'}. Please check the server logs.`;
      // }
    // }

    // Handle other specific commands if a workflow wasn't created by AI in this step.
    // These rely on the AI's textual output indicating intent, or simple keyword matching for now.
    // The if (!workflowCreatedOrAttemptedByAI) condition is removed as AI workflow creation is removed.
    
    // The AI is now expected to guide the user or respond to simple commands like listing.
    // Direct keyword matching for "list workflows" and "run workflow" can be kept for now,
    // or eventually be fully replaced by AI intent parsing if the prompt proves effective.
    if (message.toLowerCase().includes('list workflows') || text.toLowerCase().includes("call `getworkflowsforuser()`")) {
      const workflows = await getWorkflowsForUser();
      text = `Here are your existing workflows:\n${workflows.map(w => `- ${w.name} (ID: ${w.id})`).join('\n') || 'No workflows found.'}`;
    }
    else if (message.toLowerCase().includes('run workflow')) {
      const idMatch = message.match(/run workflow with id\s+([a-zA-Z0-9]+)/i); // Fixed regex: a-zA-Z
      const nameMatch = message.match(/run workflow named\s+"([^"]+)"/i);

      let workflowIdToRun: string | null = null;

      if (idMatch) {
        workflowIdToRun = (idMatch[1] !== undefined) ? (idMatch[1] as string) : null; // Assert here
      } else if (nameMatch) {
        const workflows = await getWorkflowsForUser(); // No userId argument needed
        const foundWorkflow = workflows.find(w => w.name.toLowerCase() === nameMatch[1].toLowerCase());
        workflowIdToRun = (foundWorkflow && foundWorkflow.id !== undefined) ? (foundWorkflow.id as string) : null; // Assert here
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

    // Add assistant response to history, using 'model' role
    messages.push({ role: 'model', parts: [{ text }] });

    // Save updated chat session
    await prisma.chatSession.upsert({
      where: {
        userId_workflowId: {
          userId: userId,
          workflowId: effectiveWorkflowId,
        }
      },
      update: { messages: messages as any, lastActiveAt: new Date() },
      create: { userId, workflowId: effectiveWorkflowId, messages: messages as any, lastActiveAt: new Date() },
    });

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Chatbot API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
