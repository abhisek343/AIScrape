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

  // 1. Separate nodes into Launch Browser and everything else
  const rawNodes = spec.workflow.nodes || [];
  const browserNodes = rawNodes.filter(n => n.type === 'LAUNCH_BROWSER');
  const otherNodes = rawNodes.filter(n => n.type !== 'LAUNCH_BROWSER');

  // 2. Linearize nodes with Launch Browser at the beginning
  const sortedNodes = [...browserNodes, ...otherNodes];

  const nodes = sortedNodes.map((n, idx) => {
    if (!TaskRegistry[n.type as keyof typeof TaskRegistry]) {
      throw new Error(`Unknown node type: ${n.type}`);
    }
    const id = generateUuid();
    keyToNodeId.set(n.key, id);

    // Create a spacious linear layout to prevent overlaps
    // Nodes move from left to right with a large gap
    const x = 100 + idx * 450;
    // Alternate height slightly for visual flow, but keep it within a clear band
    const y = idx % 2 === 0 ? 100 : 150;

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

  // Note: We removed the auto-insert Launch Browser logic here to rely on explicit guides.
  // This prevents double-adding and gives the user exactly what they see in the example.

  return JSON.stringify({ nodes, edges, viewport: { x: 0, y: 0, zoom: 0.8 } });
}



