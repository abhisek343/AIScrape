import { Edge } from '@xyflow/react';

type PhaseWithNode = {
  id: string;
  node: string;
};

type PhaseRef = Pick<PhaseWithNode, 'id'>;

function extractNodeId(rawNode: string): string | null {
  try {
    const parsed = JSON.parse(rawNode) as { id?: unknown };
    return typeof parsed.id === 'string' && parsed.id.length > 0 ? parsed.id : null;
  } catch {
    return null;
  }
}

export function buildPhaseNodeIdMap(phases: PhaseWithNode[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const phase of phases) {
    const nodeId = extractNodeId(phase.node);
    if (nodeId) {
      map.set(phase.id, nodeId);
    }
  }

  return map;
}

export function hasInterDependenciesInPhaseGroup(
  phasesInGroup: PhaseRef[],
  edges: Edge[],
  phaseNodeIdMap: ReadonlyMap<string, string>
): boolean {
  if (phasesInGroup.length < 2) {
    return false;
  }

  const nodeIdsInGroup = new Set<string>();
  for (const phase of phasesInGroup) {
    const nodeId = phaseNodeIdMap.get(phase.id);
    if (!nodeId) {
      // Fall back to sequential mode if we cannot resolve node IDs safely.
      return true;
    }
    nodeIdsInGroup.add(nodeId);
  }

  for (const edge of edges) {
    if (nodeIdsInGroup.has(edge.source) && nodeIdsInGroup.has(edge.target)) {
      return true;
    }
  }

  return false;
}
