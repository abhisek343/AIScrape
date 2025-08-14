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
    // Create a flowing layout with alternating heights for better connection visibility
    const x = 150 + idx * 350;
    const y = idx % 2 === 0 ? 100 : 250;
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

  // Auto-insert a Launch Browser node if any node requires a 'Web page' input that isn't connected
  const hasLaunchBrowser = nodes.some(n => n.data.type === 'LAUNCH_BROWSER');
  if (!hasLaunchBrowser) {
    // Build a quick lookup for node definitions
    const nodeDefById = new Map(nodes.map(n => [n.id, TaskRegistry[n.data.type as keyof typeof TaskRegistry]]));

    // Find a node that requires a 'Web page' input and is missing an incoming edge for it
    const targetNeedingWebPage = nodes.find(n => {
      const def = nodeDefById.get(n.id);
      if (!def) return false;
      const needsWebPage = !!def.inputs?.some(i => i.name === 'Web page');
      if (!needsWebPage) return false;
      const hasIncomingWebPage = edges.some(e => e.target === n.id && e.targetHandle === 'Web page');
      return !hasIncomingWebPage;
    });

    if (targetNeedingWebPage) {
      const launchId = generateUuid();
      nodes.unshift({
        id: launchId,
        type: 'AIScrapeNode',
        dragHandle: '.drag-handle',
        data: { type: 'LAUNCH_BROWSER', inputs: { 'Website Url': 'https://example.com' } },
        position: { x: 100, y: 100 },
      });
      // Connect Launch Browser -> targetNeedingWebPage
      edges.unshift({
        id: generateUuid(),
        source: launchId,
        target: targetNeedingWebPage.id,
        sourceHandle: 'Web page',
        targetHandle: 'Web page',
        animated: true,
      });
    }
  }

  return JSON.stringify({ nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } });
}



