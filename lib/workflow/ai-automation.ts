import { TaskRegistry } from '@/lib/workflow/task/registry';

export type AiAutomationSpec = {
  action?: 'CREATE_ONLY' | 'CREATE_AND_RUN' | 'UPDATE_ONLY' | 'UPDATE_AND_RUN';
  workflow: {
    name?: string;
    description?: string;
    nodes: Array<{
      key: string;
      type: string;
      inputs?: Record<string, string>;
    }>;
    edges?: Array<{
      from: { node: string; output?: string };
      to: { node: string; input: string };
    }>;
  };
};

function generateUuid(): string {
  try {
    // @ts-ignore - crypto is available in Node runtime
    return crypto.randomUUID();
  } catch {
    return 'id-' + Math.random().toString(36).slice(2);
  }
}

export function buildDefinitionFromAiSpec(spec: AiAutomationSpec): string {
  const keyToNodeId = new Map<string, string>();
  const nodes = (spec.workflow.nodes || []).map((n, idx) => {
    if (!TaskRegistry[n.type as keyof typeof TaskRegistry]) {
      throw new Error(`Unknown node type: ${n.type}`);
    }
    const id = generateUuid();
    keyToNodeId.set(n.key, id);
    const x = 80 + idx * 260;
    const y = 80;
    return {
      id,
      type: 'AIScrapeNode',
      dragHandle: '.drag-handle',
      data: {
        type: n.type,
        inputs: n.inputs || {},
      },
      position: { x, y },
    };
  });

  const edges = (spec.workflow.edges || []).map((e) => {
    const sourceId = keyToNodeId.get(e.from.node);
    const targetId = keyToNodeId.get(e.to.node);
    if (!sourceId || !targetId) {
      throw new Error(`Invalid edge mapping: ${e.from.node} -> ${e.to.node}`);
    }
    return {
      id: generateUuid(),
      source: sourceId,
      target: targetId,
      sourceHandle: e.from.output || undefined,
      targetHandle: e.to.input,
      animated: true,
    };
  });

  return JSON.stringify({ nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } });
}



