import { Edge } from '@xyflow/react';

import {
  buildPhaseNodeIdMap,
  hasInterDependenciesInPhaseGroup,
} from '@/lib/workflow/phase-dependencies';

describe('phase dependency helpers', () => {
  it('builds a phase-id -> node-id map from persisted phase nodes', () => {
    const map = buildPhaseNodeIdMap([
      { id: 'phase-1', node: JSON.stringify({ id: 'A' }) },
      { id: 'phase-2', node: JSON.stringify({ id: 'B' }) },
      { id: 'phase-3', node: 'not json' },
    ]);

    expect(map.get('phase-1')).toBe('A');
    expect(map.get('phase-2')).toBe('B');
    expect(map.has('phase-3')).toBe(false);
  });

  it('detects inter-dependencies using node ids (not phase ids)', () => {
    const phases = [
      { id: 'phase-1', node: JSON.stringify({ id: 'A' }) },
      { id: 'phase-2', node: JSON.stringify({ id: 'B' }) },
    ];
    const edges: Edge[] = [{ id: 'A-B', source: 'A', target: 'B' }];

    const hasDependencies = hasInterDependenciesInPhaseGroup(
      phases,
      edges,
      buildPhaseNodeIdMap(phases)
    );

    expect(hasDependencies).toBe(true);
  });

  it('returns false when no nodes in the group depend on each other', () => {
    const phases = [
      { id: 'phase-1', node: JSON.stringify({ id: 'A' }) },
      { id: 'phase-2', node: JSON.stringify({ id: 'B' }) },
    ];
    const edges: Edge[] = [{ id: 'A-C', source: 'A', target: 'C' }];

    const hasDependencies = hasInterDependenciesInPhaseGroup(
      phases,
      edges,
      buildPhaseNodeIdMap(phases)
    );

    expect(hasDependencies).toBe(false);
  });

  it('falls back to sequential mode when a phase node id cannot be resolved', () => {
    const phases = [
      { id: 'phase-1', node: JSON.stringify({ id: 'A' }) },
      { id: 'phase-2', node: '{}' },
    ];

    const hasDependencies = hasInterDependenciesInPhaseGroup(
      phases,
      [],
      buildPhaseNodeIdMap(phases)
    );

    expect(hasDependencies).toBe(true);
  });
});
