import { Edge } from '@xyflow/react';

import { AppNode } from '@/types/appnode';
import { TaskType } from '@/types/task';
import { TaskParamType } from '@/types/task';
import type { WorkflowChaosReport } from '@/lib/workflow/chaos-lab';

jest.mock('@/lib/workflow/task/registry', () => ({
  TaskRegistry: {
    LAUNCH_BROWSER: {
      label: 'Launch Browser',
      credits: 5,
      inputs: [{ name: 'Website Url', type: TaskParamType.STRING, required: true }],
      outputs: [{ name: 'Web page', type: TaskParamType.BROWSER_INSTANCE }],
    },
    PAGE_TO_HTML: {
      label: 'Get html from page',
      credits: 2,
      inputs: [{ name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true }],
      outputs: [
        { name: 'Html', type: TaskParamType.STRING },
        { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE },
      ],
    },
    EXTRACT_ATTRIBUTES: {
      label: 'Extract attributes',
      credits: 1,
      inputs: [
        { name: 'Html', type: TaskParamType.STRING, required: true },
        { name: 'Selector', type: TaskParamType.STRING, required: true },
        { name: 'Attribute', type: TaskParamType.STRING, required: true },
      ],
      outputs: [{ name: 'Values (JSON)', type: TaskParamType.STRING }],
    },
  },
}));

jest.mock('@/lib/workflow/execution-plan', () => ({
  flowToExecutionPlan: (nodes: AppNode[]) => ({
    executionPlan: [
      { phase: 1, nodes: nodes.filter((node) => node.id === 'A') },
      { phase: 2, nodes: nodes.filter((node) => node.id !== 'A') },
    ],
  }),
}));

const { analyzeWorkflowChaos } = require('@/lib/workflow/chaos-lab');

function node(id: string, type: TaskType, inputs: Record<string, string>): AppNode {
  return {
    id,
    type: 'AIScrapeNode',
    position: { x: 0, y: 0 },
    data: { type, inputs },
  } as AppNode;
}

function edge(
  id: string,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string
): Edge {
  return {
    id,
    source,
    sourceHandle,
    target,
    targetHandle,
  };
}

describe('analyzeWorkflowChaos', () => {
  it('returns a high-severity issue for empty workflows', () => {
    const report: WorkflowChaosReport = analyzeWorkflowChaos([], [], 100);

    expect(report.metrics.nodeCount).toBe(0);
    expect(report.issues.some((issue: { id: string }) => issue.id === 'empty-workflow')).toBe(true);
  });

  it('detects fragile selectors and no-wait risks in a valid browser flow', () => {
    const nodes: AppNode[] = [
      node('A', TaskType.LAUNCH_BROWSER, { 'Website Url': 'https://example.com' }),
      node('B', TaskType.PAGE_TO_HTML, {}),
      node('C', TaskType.EXTRACT_ATTRIBUTES, {
        Html: '',
        Selector: 'div > ul > li:nth-child(3) a',
        Attribute: 'href',
      }),
    ];

    const edges: Edge[] = [
      edge('E1', 'A', 'Web page', 'B', 'Web page'),
      edge('E2', 'B', 'Html', 'C', 'Html'),
    ];

    const report: WorkflowChaosReport = analyzeWorkflowChaos(nodes, edges, 120);

    expect(report.metrics.nodeCount).toBe(3);
    expect(report.metrics.edgeCount).toBe(2);
    expect(report.metrics.predictedSuccessRate).toBeGreaterThan(0);
    expect(report.issues.some((issue: { id: string }) => issue.id.startsWith('fragile-selector-'))).toBe(true);
    expect(report.issues.some((issue: { id: string }) => issue.id === 'no-wait-guard')).toBe(true);
    expect(
      report.issues.some(
        (issue: { id: string; autoFix?: string }) =>
          issue.id === 'no-wait-guard' && issue.autoFix === 'ADD_WAIT_GUARD'
      )
    ).toBe(true);
  });
});
