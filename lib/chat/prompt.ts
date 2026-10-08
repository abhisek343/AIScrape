import { TaskRegistry } from '@/lib/workflow/task/registry';
import {
  flowToExecutionPlan,
  FlowToExecutionPlanValidationError,
} from '@/lib/workflow/execution-plan';
import type { AppNode } from '@/types/appnode';
import type { TaskParam } from '@/types/task';

export const MAX_CHAT_MESSAGES = 40;
export const MAX_CHAT_MESSAGE_CHARS = 12_000;
export const MAX_WORKFLOW_CONTEXT_CHARS = 512_000;

const SENSITIVE_WORKFLOW_INPUT =
  /(credential|authorization|header|cookie|token|secret|password|api.?key|local.?storage)/i;

const DETAILED_DESCRIPTIONS: Record<string, string> = {
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

type ChatMessage = {
  role: string;
  parts: { text: string }[];
};

function summarizeWorkflowInput(name: string, value: unknown): string {
  if (SENSITIVE_WORKFLOW_INPUT.test(name)) return `${name}: [configured]`;
  const rendered = String(value);
  return `${name}: ${rendered.length > 160 ? `${rendered.slice(0, 160)}…` : rendered}`;
}

function buildAvailableNodesDescription(): string {
  const lines: string[] = [];

  for (const [type, task] of Object.entries(TaskRegistry)) {
    const dataInputs = (task.inputs || []).filter((param: TaskParam) => param.hideHandle);
    const edgeInputs = (task.inputs || []).filter((param: TaskParam) => !param.hideHandle);
    const outputs = task.outputs || [];
    const description = DETAILED_DESCRIPTIONS[type] || `${task.label} node.`;
    const parts: string[] = [`- ${type} (${task.label}): ${description}`];

    if (task.isEntryPoint) parts.push('Entry point: Yes.');
    if (typeof task.credits === 'number') parts.push(`Credits: ${task.credits}.`);
    if (dataInputs.length > 0) {
      parts.push(`Node Data Inputs: ${dataInputs.map((input: TaskParam) => input.name).join(', ')}.`);
    }
    if (edgeInputs.length > 0) {
      parts.push(`Edge Inputs: ${edgeInputs.map((input: TaskParam) => input.name).join(', ')}.`);
    }
    if (outputs.length > 0) {
      parts.push(`Outputs: ${outputs.map((output: TaskParam) => output.name).join(', ')}.`);
    }

    lines.push(parts.join(' '));
  }

  return lines.join('\n            ');
}

export function analyzeWorkflowIssues(definition: string): string[] {
  try {
    const parsed = JSON.parse(definition);
    const nodes = Array.isArray(parsed?.nodes) ? parsed.nodes as AppNode[] : [];
    const edges = Array.isArray(parsed?.edges) ? parsed.edges : [];

    if (nodes.length === 0) {
      return ["Empty workflow: No nodes added yet. Start by dragging a 'Launch Browser' node from the sidebar."];
    }

    const { error } = flowToExecutionPlan(nodes, edges);
    const issues: string[] = [];

    if (error?.type === FlowToExecutionPlanValidationError.NO_ENTRY_POINT) {
      issues.push("Missing entry point: Add a 'Launch Browser' node to start the workflow. This node must be the first step.");
    }

    if (error?.type === FlowToExecutionPlanValidationError.INVALID_INPUTS && error.invalidElements) {
      for (const element of error.invalidElements) {
        const node = nodes.find((candidate) => candidate.id === element.nodeId);
        const nodeType = node?.data?.type;
        const task = nodeType ? TaskRegistry[nodeType as keyof typeof TaskRegistry] : undefined;
        const nodeLabel = task?.label || nodeType || 'Unknown node';
        const inputsList = element.inputs.join(', ');

        if (element.inputs.includes('Node is not reachable') || element.inputs.includes('cycle')) {
          issues.push(`'${nodeLabel}' is disconnected: Connect it to the main workflow flow with edges.`);
        } else {
          issues.push(
            `'${nodeLabel}' has missing inputs: ${inputsList}. Either fill in the value directly or connect an edge from another node's output.`,
          );
        }
      }
    }

    return issues;
  } catch {
    return [];
  }
}

export function buildWorkflowContextHeader(input: {
  name?: string | null;
  description?: string | null;
  definition?: string | null;
}): string {
  const definition = input.definition;
  let narrative = '';

  if (definition) {
    try {
      const parsed = JSON.parse(definition);
      const nodes = Array.isArray(parsed?.nodes) ? parsed.nodes : [];

      if (nodes.length > 0) {
        const steps = nodes.map((node: any) => {
          const nodeType: string | undefined = node?.data?.type;
          const task = nodeType ? TaskRegistry[nodeType as keyof typeof TaskRegistry] : undefined;
          const label = task?.label || nodeType || 'Unknown';
          const inputs = node?.data?.inputs || {};
          const inputPairs = Object.entries(inputs).map(([name, value]) =>
            summarizeWorkflowInput(name, value),
          );
          const description = nodeType ? DETAILED_DESCRIPTIONS[nodeType] || '' : '';

          return inputPairs.length > 0
            ? `${label} (${nodeType}). ${description} Inputs: ${inputPairs.join(', ')}.`.trim()
            : `${label} (${nodeType}). ${description}`.trim();
        });

        narrative = `Current workflow state:\n${steps
          .map((step: string, index: number) => `${index + 1}. ${step}`)
          .join('\n')}`;
      }
    } catch {
      narrative = '';
    }
  }

  const issues = definition ? analyzeWorkflowIssues(definition) : [];
  const issuesContext = issues.length > 0
    ? `\n\n**CURRENT ISSUES DETECTED IN WORKFLOW:**\n${issues
        .map((issue, index) => `${index + 1}. ${issue}`)
        .join('\n')}`
    : '';

  return `The user is currently working on a workflow named "${input.name || 'Untitled Workflow'}". Description: "${input.description || 'No description'}". ${narrative ? `\n\n${narrative}\n\n` : ''}${issuesContext}\n\nTailor your guidance to this specific workflow if the question seems related to it.\n\n`;
}

export function buildSystemPrompt(workflowContextHeader = ''): string {
  const availableNodesDescription = buildAvailableNodesDescription();

  return `${workflowContextHeader}
You are an **Expert Automation Architect** for AIScrape.

**Personality & Style**:
- Treat the user as a colleague. Be concise, technical, and helpful.
- **ALWAYS use Markdown** for rich formatting.

**Scope**:
- Only discuss AIScrape, web scraping, and automation.
- Politely decline any off-topic or harmful requests.

You are an AI assistant for AIScrape, a SaaS platform for web scraping and workflow automation.
Your primary role is to provide information and guidance to users on how to use the platform and its features.
You have knowledge of the following available workflow nodes:
${availableNodesDescription}

Maintain a helpful, safe, and project-focused conversation.
`;
}

export function buildBoundedHistory(messages: ChatMessage[], maxChars = 48_000): string {
  return messages
    .map((entry) => `${entry.role}: ${entry.parts.map((part) => part.text).join(' ')}`)
    .join('\n')
    .slice(-maxChars);
}
