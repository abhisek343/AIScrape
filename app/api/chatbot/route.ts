import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'; // Updated import
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Import workflow and credential actions
import { getWorkflowsForUser } from '@/actions/workflows/get-workflows-for-user';
import { createWorkflow } from '@/actions/workflows/create-workflow';
import { updateWorkflow } from '@/actions/workflows/update-workflow';
import { runWorkflow } from '@/actions/workflows/run-workflow';
import { getCredentialsForUser } from '@/actions/credentials/get-credentials-for-user';
import { WorkflowExecutionTrigger, WorkflowExecutionStatus } from '@/types/workflow'; // Import WorkflowExecutionTrigger
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { AiAutomationSpec, buildDefinitionFromAiSpec } from '@/lib/workflow/ai-automation';

// Initialize Google Generative AI
if (!process.env.GOOGLE_API_KEY) {
  console.error("FATAL: GOOGLE_API_KEY is not set in .env. Chatbot API cannot initialize.");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || ""); // Provide default empty string if null/undefined to satisfy constructor, error will be caught by SDK if key is invalid/empty during API call.

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

// Moved AiAutomationSpec and builder to shared module

async function waitForExecutionAndSummarize(executionId: string, timeoutMs = 90_000) {
  const start = Date.now();
  while (true) {
    const exec = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        phases: { orderBy: { number: 'asc' }, include: { logs: true } },
      },
    });

    if (!exec) return { status: 'NOT_FOUND', summary: 'Execution not found.' } as const;

    if (
      exec.status === WorkflowExecutionStatus.COMPLETED ||
      exec.status === WorkflowExecutionStatus.FAILED
    ) {
      const outputs = (exec.phases || []).map((p: any, idx: number) => {
        let out: Record<string, any> = {};
        try {
          out = p.outputs ? JSON.parse(p.outputs) : {};
        } catch { }
        return { phase: idx + 1, name: p.name, outputs: out };
      });
      const last = outputs[outputs.length - 1];
      const lastOutSummary = last && Object.keys(last.outputs || {}).length
        ? JSON.stringify(last.outputs)
        : '(no outputs)';
      const overall = `Run ${String(exec.status).toLowerCase()}. Credits consumed: ${exec.creditsConsumed}.`;
      const phases = outputs
        .map((o: any) => `Phase ${o.phase} - ${o.name}: ${JSON.stringify(o.outputs) || '{}'}`)
        .join('\n');
      return { status: exec.status, summary: `${overall}\nLast phase outputs: ${lastOutSummary}\n\nAll phase outputs:\n${phases}` } as const;
    }

    if (Date.now() - start > timeoutMs) {
      return { status: 'TIMEOUT', summary: 'The run is still in progress. Check runs page for live status.' } as const;
    }

    await wait(800);
  }
}

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
      You are an **Expert Automation Architect** for AIScrape. Your goal is to provide elite, professional guidance on web scraping and workflow automation. 
      
      **Personality & Style**:
      - Treat the user as a colleague. Be concise, technical, and helpful.
      - **ALWAYS use Markdown** for rich formatting. Use **bolding** for emphasis, \`inline code\` for node names or parameters, and nested lists for steps.
      - Use headers (###) to organize long explanations.
      - If a user asks a simple question, answer it directly and professionally.
      
      **Scope**:
      - Only discuss AIScrape, web scraping, and automation.
      - Politely decline any off-topic or harmful requests.
    `;

    // Build rich, vivid node encyclopedia dynamically from TaskRegistry
    const DetailedDescriptions: Record<string, string> = {
      LAUNCH_BROWSER: 'Opens a fresh, automated browser and points it at the first URL in your journey. This is the doorway to any interactive scraping: cookies, scripts, and dynamic content all load just like a real user.',
      NAVIGATE_URL: 'Directs the current browser tab to a new address. Use it to hop between pages, follow links, or load paginated content deliberately.',
      PAGE_TO_HTML: 'Grabs the full HTML snapshot of the current page. Perfect when you need a static document to parse with CSS selectors or AI.',
      CLICK_ELEMENT: 'Finds a clickable thing on the page and presses it—buttons, links, toggles. Ideal for opening modals, moving through pagination, or revealing hidden content.',
      FILL_INPUT: 'Targets an input field and types the provided value. Combine with Wait or Click to log in, search, or submit forms.',
      WAIT_FOR_ELEMENT: 'Pauses until a specific element is visible or hidden. This stabilizes flows on JS-heavy sites that render content asynchronously.',
      SCROLL_TO_ELEMENT: 'Smoothly scrolls the page until a target element is in view. Useful for lazy-loaded lists or loading content deep down the page.',
      EXTRACT_TEXT_FROM_ELEMENT: 'Plucks the human-readable text from elements you identify via CSS selectors. Great for titles, prices, bios, and any visible string.',
      EXTRACT_DATA_WITH_AI: 'Reads raw text or HTML and asks an AI to return structured results according to your prompt—use it when rigid selectors fall short.',
      READ_PROPERTY_FROM_JSON: 'Looks inside a JSON blob and pulls out a specific property by key or path. Handy for chaining data between steps.',
      ADD_PROPERTY_TO_JSON: 'Takes an existing JSON string and adds another key-value pair, building richer objects as your flow progresses.',
      DELIVER_VIA_WEBHOOK: 'Ships your collected data to an external system. Post it to your API, a Zapier webhook, or any endpoint that accepts payloads.',
      SCREENSHOT: 'Captures a pixel-perfect image of the full page or a specific element. Ideal for proofs, audits, or visual archives.',
      EVALUATE_JS: 'Executes custom JavaScript in the page context. Use it to compute values, read DOM state, or interact in ways prebuilt nodes do not cover.',
      SET_VIEWPORT: 'Configures the page size and device scale. Simulate mobile, tablet, or desktop layouts to influence responsive content.',
      SET_USER_AGENT: 'Impersonates a specific browser or device by setting the user agent string before navigation.',
      SET_COOKIES: 'Seeds the page with cookies (e.g., auth, preferences) before interactions to emulate a returning user or bypass gates.',
      SET_LOCAL_STORAGE: 'Writes directly into localStorage for the page—often used for flags or lightweight tokens before loading content.',
      HOVER_ELEMENT: 'Moves the virtual mouse over an element to trigger hover menus or reveal hidden sections.',
      KEYBOARD_TYPE: 'Types keystrokes into the active page, optionally with per-character delays to mimic human input.',
      WAIT_FOR_NETWORK_IDLE: 'Waits until network requests settle. Use after navigation or interactions to ensure the page is truly ready.',
      WAIT_FOR_NAVIGATION: 'Pauses until the page navigates and commits. A reliable guard after clicks that change the URL.',
      HTTP_REQUEST: 'Performs a direct HTTP call (GET/POST/etc.) without the browser. Perfect for APIs, webhooks, or fetching supporting data.',
      EXTRACT_ATTRIBUTES: 'Collects attribute values (like href, src, alt) from elements matched by a selector, returning structured lists.',
      EXTRACT_LIST: 'Pulls repeated text items into a JSON array from lists, grids, or tables by selector.',
      REGEX_EXTRACT: 'Runs a regular expression on any text to capture precise patterns like emails, IDs, or price tokens.',
      INFINITE_SCROLL: 'Scrolls repeatedly to load more results on endless pages. Tune iterations and delays to match site behavior.',
      DELAY: 'Intentionally waits for a fixed duration. Use sparingly when a site needs breathing room beyond event-based waits.',
    };

    function buildAvailableNodesDescription(): string {
      const lines: string[] = [];
      for (const [type, task] of Object.entries(TaskRegistry)) {
        const dataInputs = (task.inputs || []).filter((p) => p.hideHandle);
        const edgeInputs = (task.inputs || []).filter((p) => !p.hideHandle);
        const outputs = task.outputs || [];
        const desc = DetailedDescriptions[type] || `${task.label} node.`;
        const parts: string[] = [];
        parts.push(`- ${type} (${task.label}): ${desc}`);
        if (task.isEntryPoint) parts.push(`Entry point: Yes.`);
        if (typeof task.credits === 'number') parts.push(`Credits: ${task.credits}.`);
        if (dataInputs.length > 0) {
          parts.push(`Node Data Inputs: ${dataInputs.map((i) => `${i.name}`).join(', ')}.`);
        }
        if (edgeInputs.length > 0) {
          parts.push(`Edge Inputs: ${edgeInputs.map((i) => `${i.name}`).join(', ')}.`);
        }
        if (outputs.length > 0) {
          parts.push(`Outputs: ${outputs.map((o) => `${o.name}`).join(', ')}.`);
        }
        lines.push(parts.join(' '));
      }
      return lines.join('\n            ');
    }

    const availableNodesDescription = buildAvailableNodesDescription();

    // Unified prompt section for AI capabilities (planning and acting)

    let workflowContextHeader = "";
    if (clientWorkflowId && clientWorkflowId !== GENERAL_CHAT_PLACEHOLDER) { // Check if it's a specific workflow
      const currentWorkflow = await prisma.workflow.findUnique({
        where: { id: clientWorkflowId, userId: userId }, // Ensure user owns the workflow
        select: { name: true, description: true, definition: true }
      });
      if (currentWorkflow) {
        let narrative = '';
        try {
          const def = currentWorkflow.definition ? JSON.parse(currentWorkflow.definition) : null;
          const nodes = Array.isArray(def?.nodes) ? def.nodes : [];
          if (nodes.length > 0) {
            const steps: string[] = [];
            for (const node of nodes) {
              const nodeType: string | undefined = node?.data?.type;
              const reg = nodeType ? (TaskRegistry as any)[nodeType] : undefined;
              const label = reg?.label || nodeType || 'Unknown';
              const inputs = node?.data?.inputs || {};
              const inputPairs = Object.entries(inputs).map(([k, v]) => `${k}: ${String(v)}`);
              const desc = nodeType && DetailedDescriptions[nodeType] ? DetailedDescriptions[nodeType] : '';
              const line = inputPairs.length > 0
                ? `${label} (${nodeType}). ${desc} Inputs: ${inputPairs.join(', ')}.`
                : `${label} (${nodeType}). ${desc}`;
              steps.push(line.trim());
            }
            narrative = `Workflow outline:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
          }
        } catch { }
        const wfDesc = currentWorkflow.description || 'No description';
        workflowContextHeader = `The user is currently working on a workflow named "${currentWorkflow.name}". Description: "${wfDesc}". ${narrative ? `\n\n${narrative}\n\n` : ''}Tailor your guidance to this specific workflow if the question seems related to it.\n\n`;
      }
    }

    systemPrompt += `

You are an AI assistant for AIScrape, a SaaS platform for web scraping and workflow automation.
Your primary role is to provide information and guidance to users on how to use the platform and its features, especially the workflow editor.
You have knowledge of the following available workflow nodes:
${availableNodesDescription}

When a user asks how to achieve a task (e.g., "how do I extract data from LinkedIn?"):
1. Understand their goal.
2. Suggest a sequence of the available nodes that could accomplish this.
3. Explain what each node in your suggested sequence does and why it's useful for their goal.
4. To visually represent the suggested workflow, generate a Mermaid flowchart diagram (using graph TD; or graph LR;). Enclose the Mermaid code in a standard fenced code block labeled mermaid. Example:
   \`\`\`mermaid
   graph TD;
     A[Node 1] --> B[Node 2];
   \`\`\`
5. You DO NOT create or attempt to create workflows. Your purpose is to guide the user so they can build the workflow themselves in the editor, using your textual explanation and the Mermaid diagram as aids.

If the user asks to list their workflows or credentials, the system will handle this if you indicate that action.
You DO NOT run workflows; guide the user to do this manually.

Maintain a helpful, safe, and project-focused conversation.
    `;

    // Automation mode: If the user explicitly asks to "automate", "create", or "build" a workflow,
    // produce ONLY one JSON block describing the workflow to create or update, with the schema below.
    // The client will parse and execute it. Do not include any prose before or after the JSON.
    systemPrompt += `

    AUTOMATION MODE (STRICT):
    Only if the user explicitly turns automation on (e.g., says "automation on", or explicitly says to automate/build/create/update a workflow), output ONLY one JSON object (no extra text, no markdown fences). The JSON schema is:
{
  "action": "CREATE_AND_RUN" | "CREATE_ONLY" | "UPDATE_AND_RUN" | "UPDATE_ONLY",
  "workflow": {
    "name": "Short descriptive name (omit for UPDATE_*)",
    "description": "Optional description",
    "nodes": [
      { "key": "A", "type": "LAUNCH_BROWSER", "inputs": { "Website Url": "https://example.com" } },
      { "key": "B", "type": "NAVIGATE_URL", "inputs": { "URL": "https://example.com/path" } }
    ],
    "edges": [
      { "from": { "node": "A", "output": "Web page" }, "to": { "node": "B", "input": "Web page" } }
    ]
  }
}
    Rules:
    - Do NOT output JSON unless the user explicitly requests automation (e.g., "automation on", "automate", "create a workflow", "update the workflow").
    - Use only node types listed above exactly.
    - Inputs must match the node's input names exactly.
    - Ensure at least one entry-point node (e.g., LAUNCH_BROWSER). Connect edges so all required inputs are satisfied.
    - For UPDATE_* actions, omit name and target the currently open workflow context.
`;

    const finalSystemPrompt = workflowContextHeader + systemPrompt;

    // Prepare the contents for the model - system prompt is prepended as a user message
    const preparedContents = [{ role: 'user' as const, parts: [{ text: finalSystemPrompt }] }, ...messages];

    // Get the generative model with optional Google Search grounding tools enabled via env flag
    const modelOptions: any = {
      model: "gemini-2.5-flash",
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
    };
    // if (process.env.GEMINI_ENABLE_GOOGLE_SEARCH?.toLowerCase() === 'true') {
    //   // Cast to any to avoid type mismatches across SDK versions
    //   // modelOptions.tools = [{ googleSearch: {} }];
    // }
    const generativeModel = genAI.getGenerativeModel(modelOptions);

    // Send the latest user message to the model
    const result = await generativeModel.generateContent({
      contents: preparedContents,
      // generationConfig: { maxOutputTokens: 2048 },
      // Optionally pass tool configuration if search is enabled (cast to any for forward-compat)
      // ...(process.env.GEMINI_ENABLE_GOOGLE_SEARCH?.toLowerCase() === 'true'
      //   ? ({ toolConfig: { googleSearch: { disableAttribution: false } } as any })
      //   : {}),
    });
    const response = result.response;
    let text = response.text(); // Correct way to get text

    // Try to detect AUTOMATION MODE output (strict JSON) only if explicitly requested
    let automationSummary: string | null = null;
    const userAskedForAutomation = /\b(automation on|automate|create (and run )?a workflow|update (and run )?the workflow|build a workflow)\b/i.test(message);
    const jsonBlock = userAskedForAutomation ? extractFirstJsonBlock(text) : null;
    if (jsonBlock) {
      const parsed = safeJsonParse<AiAutomationSpec>(jsonBlock);
      if (parsed && parsed.workflow && Array.isArray(parsed.workflow.nodes)) {
        try {
          const definition = buildDefinitionFromAiSpec(parsed);
          const shouldRun = (parsed.action || '').includes('RUN');

          if (clientWorkflowId && (parsed.action === 'UPDATE_ONLY' || parsed.action === 'UPDATE_AND_RUN')) {
            await updateWorkflow({ id: clientWorkflowId, definition });
            if (shouldRun) {
              const execution = await runWorkflow({ workflowId: clientWorkflowId, trigger: WorkflowExecutionTrigger.MANUAL, shouldRedirect: false, currentFlowDefinition: definition });
              const result = await waitForExecutionAndSummarize(execution.id);
              automationSummary = `Workflow updated and ${result.status === 'TIMEOUT' ? 'run started (await timeout)' : 'run completed'} for current workflow. Execution ID: ${execution.id}\n${result.summary}`;
            } else {
              automationSummary = `Workflow updated for current workflow.`;
            }
          } else {
            const name = parsed.workflow.name || `AI Workflow ${new Date().toISOString()}`;
            const description = parsed.workflow.description || undefined;
            const newWorkflow = await createWorkflow(name, definition, description, false);
            if (shouldRun) {
              const execution = await runWorkflow({ workflowId: newWorkflow.id, trigger: WorkflowExecutionTrigger.MANUAL, shouldRedirect: false });
              const result = await waitForExecutionAndSummarize(execution.id);
              automationSummary = `Workflow created (ID: ${newWorkflow.id}) and ${result.status === 'TIMEOUT' ? 'run started (await timeout)' : 'run completed'}. Execution ID: ${execution.id}\n${result.summary}`;
            } else {
              automationSummary = `Workflow created successfully. ID: ${newWorkflow.id}`;
            }
          }
        } catch (err: any) {
          automationSummary = `Failed to process AI automation spec: ${err?.message || err?.toString() || 'Unknown error'}`;
        }
      }
    }

    // Handle other specific commands if a workflow wasn't created by AI in this step.
    // These rely on the AI's textual output indicating intent, or simple keyword matching for now.
    // The if (!workflowCreatedOrAttemptedByAI) condition is removed as AI workflow creation is removed.

    // The AI is now expected to guide the user or respond to simple commands like listing.
    // Direct keyword matching for "list workflows" and "run workflow" can be kept for now,
    // or eventually be fully replaced by AI intent parsing if the prompt proves effective.
    if (automationSummary) {
      text = automationSummary;
    }
    else if (message.toLowerCase().includes('list workflows') || text.toLowerCase().includes("call `getworkflowsforuser()`")) {
      const workflows = await getWorkflowsForUser();
      text = `Here are your existing workflows:\n${workflows.map((w: any) => `- ${w.name} (ID: ${w.id})`).join('\n') || 'No workflows found.'}`;
    }
    else if (message.toLowerCase().includes('run workflow')) {
      const idMatch = message.match(/run workflow with id\s+([a-zA-Z0-9_-]+)/i); // Match CUID format with hyphens and underscores
      const nameMatch = message.match(/run workflow named\s+"([^"]+)"/i);

      let workflowIdToRun: string | null = null;

      if (idMatch) {
        workflowIdToRun = (idMatch[1] !== undefined) ? (idMatch[1] as string) : null; // Assert here
      } else if (nameMatch) {
        const workflows = await getWorkflowsForUser(); // No userId argument needed
        const foundWorkflow = workflows.find((w: any) => w.name.toLowerCase() === nameMatch[1].toLowerCase());
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
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
}
