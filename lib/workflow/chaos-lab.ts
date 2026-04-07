import { Edge } from '@xyflow/react';

import { flowToExecutionPlan } from '@/lib/workflow/execution-plan';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { AppNode } from '@/types/appnode';
import { TaskParamType, TaskType } from '@/types/task';

type RiskLevel = 'low' | 'medium' | 'high';
export type ChaosAutoFix = 'ADD_WAIT_GUARD';

export type ChaosIssue = {
  id: string;
  level: RiskLevel;
  title: string;
  details: string;
  fix: string;
  impact: number;
  nodeId?: string;
  autoFix?: ChaosAutoFix;
};

type NodeRisk = {
  nodeId: string;
  label: string;
  type: TaskType;
  failureProbability: number;
};

type Bottleneck = {
  nodeId: string;
  label: string;
  avgDurationMs: number;
};

export type WorkflowChaosReport = {
  fingerprint: string;
  generatedAt: string;
  simulationRuns: number;
  metrics: {
    overallScore: number;
    resilienceScore: number;
    maintainabilityScore: number;
    complexityScore: number;
    predictedSuccessRate: number;
    p50DurationMs: number;
    p95DurationMs: number;
    estimatedCreditsPerRun: number;
    nodeCount: number;
    edgeCount: number;
    phaseCount: number;
    maxPhaseWidth: number;
  };
  issues: ChaosIssue[];
  recommendations: string[];
  bottlenecks: Bottleneck[];
  nodeRisks: NodeRisk[];
};

const BASE_FAILURE_PROBABILITY: Partial<Record<TaskType, number>> = {
  [TaskType.LAUNCH_BROWSER]: 0.05,
  [TaskType.NAVIGATE_URL]: 0.05,
  [TaskType.PAGE_TO_HTML]: 0.03,
  [TaskType.CLICK_ELEMENT]: 0.07,
  [TaskType.FILL_INPUT]: 0.06,
  [TaskType.HOVER_ELEMENT]: 0.05,
  [TaskType.KEYBOARD_TYPE]: 0.05,
  [TaskType.WAIT_FOR_ELEMENT]: 0.03,
  [TaskType.WAIT_FOR_NAVIGATION]: 0.03,
  [TaskType.WAIT_FOR_NETWORK_IDLE]: 0.03,
  [TaskType.EXTRACT_TEXT_FROM_ELEMENT]: 0.05,
  [TaskType.EXTRACT_ATTRIBUTES]: 0.05,
  [TaskType.EXTRACT_LIST]: 0.06,
  [TaskType.REGEX_EXTRACT]: 0.04,
  [TaskType.EXTRACT_DATA_WITH_AI]: 0.08,
  [TaskType.HTTP_REQUEST]: 0.05,
  [TaskType.DELIVER_VIA_WEBHOOK]: 0.04,
  [TaskType.EVALUATE_JS]: 0.07,
  [TaskType.SCREENSHOT]: 0.04,
  [TaskType.INFINITE_SCROLL]: 0.06,
};

const BASE_DURATION_MS: Partial<Record<TaskType, number>> = {
  [TaskType.LAUNCH_BROWSER]: 1600,
  [TaskType.NAVIGATE_URL]: 1100,
  [TaskType.PAGE_TO_HTML]: 450,
  [TaskType.CLICK_ELEMENT]: 350,
  [TaskType.FILL_INPUT]: 380,
  [TaskType.HOVER_ELEMENT]: 260,
  [TaskType.KEYBOARD_TYPE]: 300,
  [TaskType.WAIT_FOR_ELEMENT]: 900,
  [TaskType.WAIT_FOR_NAVIGATION]: 1100,
  [TaskType.WAIT_FOR_NETWORK_IDLE]: 1300,
  [TaskType.EXTRACT_TEXT_FROM_ELEMENT]: 420,
  [TaskType.EXTRACT_ATTRIBUTES]: 450,
  [TaskType.EXTRACT_LIST]: 700,
  [TaskType.REGEX_EXTRACT]: 220,
  [TaskType.EXTRACT_DATA_WITH_AI]: 2100,
  [TaskType.HTTP_REQUEST]: 850,
  [TaskType.DELIVER_VIA_WEBHOOK]: 480,
  [TaskType.EVALUATE_JS]: 520,
  [TaskType.SCREENSHOT]: 580,
  [TaskType.INFINITE_SCROLL]: 1400,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function stringHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[clamp(index, 0, sorted.length - 1)];
}

function toRiskLevel(impact: number): RiskLevel {
  if (impact >= 15) return 'high';
  if (impact >= 8) return 'medium';
  return 'low';
}

function getTaskType(node: AppNode): TaskType | null {
  return node?.data?.type ?? null;
}

function isBrowserContextNode(node: AppNode): boolean {
  const taskType = getTaskType(node);
  if (!taskType) return false;
  const task = TaskRegistry[taskType];
  if (!task) return false;

  return [...task.inputs, ...task.outputs].some((param) => param.type === TaskParamType.BROWSER_INSTANCE);
}

function selectorRisk(selector: string): number {
  let risk = 0;
  if (selector.length > 120) risk += 0.03;
  if (/:nth-child|:nth-of-type/.test(selector)) risk += 0.05;
  if (/\s>\s|\s\+\s|\s~\s/.test(selector)) risk += 0.03;
  if (/^(div|span)([.#\s]|$)/.test(selector.trim())) risk += 0.03;
  return clamp(risk, 0, 0.12);
}

function formatMs(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${Math.round(value)}ms`;
}

export function formatChaosLabSummary(report: WorkflowChaosReport): string {
  const topIssues = report.issues.slice(0, 3);
  const topBottleneck = report.bottlenecks[0];
  return [
    `Chaos Lab Score: ${report.metrics.overallScore}/100`,
    `Predicted success: ${report.metrics.predictedSuccessRate.toFixed(1)}% (${report.simulationRuns} sims)`,
    `P95 runtime: ${formatMs(report.metrics.p95DurationMs)}`,
    `Credits/run: ${report.metrics.estimatedCreditsPerRun}`,
    topBottleneck ? `Primary bottleneck: ${topBottleneck.label} (${formatMs(topBottleneck.avgDurationMs)})` : '',
    ...topIssues.map((issue, index) => `${index + 1}. ${issue.title} -> ${issue.fix}`),
  ]
    .filter(Boolean)
    .join('\n');
}

export function analyzeWorkflowChaos(
  nodes: AppNode[],
  edges: Edge[],
  simulationRuns = 400
): WorkflowChaosReport {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeEdges = Array.isArray(edges) ? edges : [];
  const issues: ChaosIssue[] = [];

  const fingerprint = stringHash(
    JSON.stringify({
      nodes: safeNodes.map((node) => ({
        id: node.id,
        type: node.data?.type,
        inputs: node.data?.inputs ?? {},
      })),
      edges: safeEdges.map((edge) => ({
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
        targetHandle: edge.targetHandle,
      })),
    })
  ).toString(16);

  if (safeNodes.length === 0) {
    issues.push({
      id: 'empty-workflow',
      level: 'high',
      title: 'No nodes to execute',
      details: 'The workflow graph is empty.',
      fix: 'Add at least one entry point node to create a runnable flow.',
      impact: 20,
    });
  }

  const planResult = flowToExecutionPlan(safeNodes, safeEdges);
  const phases = planResult.executionPlan ?? [{ phase: 1, nodes: safeNodes }];

  if (planResult.error?.invalidElements?.length) {
    for (const invalid of planResult.error.invalidElements) {
      issues.push({
        id: `invalid-inputs-${invalid.nodeId}`,
        level: 'high',
        nodeId: invalid.nodeId,
        title: 'Required input missing',
        details: `Node ${invalid.nodeId} has unresolved inputs: ${invalid.inputs.join(', ')}`,
        fix: 'Provide direct values or connect the expected upstream handles.',
        impact: 16,
      });
    }
  }

  const nodeRiskMap = new Map<string, number>();
  const nodeLabelMap = new Map<string, string>();
  let totalCredits = 0;

  for (const node of safeNodes) {
    const taskType = getTaskType(node);
    if (!taskType) continue;
    const task = TaskRegistry[taskType];
    if (!task) continue;

    nodeLabelMap.set(node.id, task.label);
    totalCredits += task.credits ?? 0;

    let risk = BASE_FAILURE_PROBABILITY[taskType] ?? 0.03;

    const missingRequiredInputs: string[] = [];
    for (const input of task.inputs) {
      if (input.type === TaskParamType.BROWSER_INSTANCE || !input.required) continue;
      const directValue = node.data?.inputs?.[input.name];
      const directProvided = directValue !== undefined && directValue !== null && directValue !== '';
      const hasEdge = safeEdges.some(
        (edge) => edge.target === node.id && edge.targetHandle === input.name
      );
      if (!directProvided && !hasEdge) {
        missingRequiredInputs.push(input.name);
      }
    }

    if (missingRequiredInputs.length > 0) {
      risk += 0.15;
      issues.push({
        id: `missing-required-${node.id}`,
        level: 'high',
        nodeId: node.id,
        title: `${task.label}: unresolved required inputs`,
        details: `Missing: ${missingRequiredInputs.join(', ')}`,
        fix: 'Fill required inputs or connect them from upstream outputs.',
        impact: 18,
      });
    }

    const selectorInputs = Object.entries(node.data?.inputs ?? {}).filter(([name, value]) => {
      return name.toLowerCase().includes('selector') && typeof value === 'string' && value.length > 0;
    });

    for (const [name, selector] of selectorInputs) {
      const riskDelta = selectorRisk(selector as string);
      if (riskDelta > 0.04) {
        issues.push({
          id: `fragile-selector-${node.id}-${name}`,
          level: 'medium',
          nodeId: node.id,
          title: `${task.label}: brittle selector pattern`,
          details: `Input "${name}" uses a selector likely to break after minor DOM changes.`,
          fix: 'Prefer stable attributes like data-testid, IDs, or semantic selectors.',
          impact: 9,
        });
      }
      risk += riskDelta;
    }

    nodeRiskMap.set(node.id, clamp(risk, 0.01, 0.8));
  }

  const hasWaitNode = safeNodes.some((node) => {
    const taskType = getTaskType(node);
    return (
      taskType === TaskType.WAIT_FOR_ELEMENT ||
      taskType === TaskType.WAIT_FOR_NAVIGATION ||
      taskType === TaskType.WAIT_FOR_NETWORK_IDLE ||
      taskType === TaskType.DELAY
    );
  });

  const hasBrowserInteraction = safeNodes.some((node) => {
    const taskType = getTaskType(node);
    return (
      taskType === TaskType.NAVIGATE_URL ||
      taskType === TaskType.CLICK_ELEMENT ||
      taskType === TaskType.FILL_INPUT ||
      taskType === TaskType.EXTRACT_TEXT_FROM_ELEMENT ||
      taskType === TaskType.EXTRACT_ATTRIBUTES ||
      taskType === TaskType.EXTRACT_LIST
    );
  });

  if (!hasWaitNode && hasBrowserInteraction) {
    issues.push({
      id: 'no-wait-guard',
      level: 'medium',
      title: 'No explicit wait guard in browser flow',
      details: 'Dynamic pages often need a wait gate before interaction or extraction.',
      fix: 'Add WAIT_FOR_ELEMENT or WAIT_FOR_NETWORK_IDLE before extraction-heavy nodes.',
      impact: 10,
      autoFix: 'ADD_WAIT_GUARD',
    });
  }

  let maxPhaseWidth = 0;
  for (const phase of phases) {
    maxPhaseWidth = Math.max(maxPhaseWidth, phase.nodes.length);
    if (phase.nodes.length < 2) continue;
    const browserNodesInPhase = phase.nodes.filter((node) => isBrowserContextNode(node));
    if (browserNodesInPhase.length > 1) {
      issues.push({
        id: `sequential-browser-phase-${phase.phase}`,
        level: 'medium',
        title: `Phase ${phase.phase} includes ${browserNodesInPhase.length} browser-context nodes`,
        details: 'These nodes share browser/page state and will run sequentially for safety.',
        fix: 'Split heavy browser nodes into explicit phases if you want clearer runtime behavior.',
        impact: 8,
      });
    }
  }

  if (safeNodes.length > 24) {
    issues.push({
      id: 'high-node-count',
      level: 'medium',
      title: 'Large workflow graph',
      details: `${safeNodes.length} nodes increases maintenance and debugging overhead.`,
      fix: 'Break this into reusable sub-workflows or staged automations.',
      impact: 8,
    });
  }

  if (totalCredits > 100) {
    issues.push({
      id: 'high-credit-cost',
      level: 'medium',
      title: 'High credits per run',
      details: `Estimated credits per execution is ${totalCredits}.`,
      fix: 'Cache expensive steps or reduce AI-heavy/external-call nodes.',
      impact: 8,
    });
  }

  const simulationSeed = stringHash(
    `${fingerprint}:${safeNodes.length}:${safeEdges.length}:${simulationRuns}`
  );
  const rng = createRng(simulationSeed);
  const nodeTimingStats = new Map<string, { attempts: number; totalDurationMs: number }>();
  const durations: number[] = [];
  let successCount = 0;

  for (let run = 0; run < simulationRuns; run++) {
    let runDuration = 0;
    let runSuccess = true;

    for (const phase of phases) {
      const sequentialPhase = phase.nodes.some((node) => isBrowserContextNode(node));
      let phaseFailed = false;
      let phaseDuration = 0;
      let phaseMaxDuration = 0;

      for (const node of phase.nodes) {
        if (sequentialPhase && phaseFailed) {
          break;
        }

        const taskType = getTaskType(node);
        const baseDuration = taskType ? BASE_DURATION_MS[taskType] ?? 320 : 320;
        const duration = baseDuration * (0.75 + rng() * 0.7);

        const stats = nodeTimingStats.get(node.id) ?? { attempts: 0, totalDurationMs: 0 };
        stats.attempts += 1;
        stats.totalDurationMs += duration;
        nodeTimingStats.set(node.id, stats);

        if (sequentialPhase) {
          phaseDuration += duration;
        } else {
          phaseMaxDuration = Math.max(phaseMaxDuration, duration);
        }

        const nodeRisk = nodeRiskMap.get(node.id) ?? 0.03;
        if (rng() < nodeRisk) {
          phaseFailed = true;
          if (!sequentialPhase) {
            // Continue sampling the rest of the phase nodes so max duration stays realistic.
            continue;
          }
        }
      }

      runDuration += sequentialPhase ? phaseDuration : phaseMaxDuration;

      if (phaseFailed) {
        runSuccess = false;
        break;
      }
    }

    durations.push(runDuration);
    if (runSuccess) {
      successCount += 1;
    }
  }

  const predictedSuccessRate = (successCount / Math.max(1, simulationRuns)) * 100;
  const p50DurationMs = percentile(durations, 50);
  const p95DurationMs = percentile(durations, 95);

  if (predictedSuccessRate < 70) {
    issues.push({
      id: 'low-predicted-success',
      level: 'high',
      title: 'Low predicted reliability under chaos simulation',
      details: `Predicted success is ${predictedSuccessRate.toFixed(1)}% across ${simulationRuns} simulations.`,
      fix: 'Add wait guards, simplify fragile selectors, and split risky steps.',
      impact: 20,
      autoFix: 'ADD_WAIT_GUARD',
    });
  } else if (predictedSuccessRate < 85) {
    issues.push({
      id: 'moderate-predicted-success',
      level: 'medium',
      title: 'Reliability could be improved',
      details: `Predicted success is ${predictedSuccessRate.toFixed(1)}% across ${simulationRuns} simulations.`,
      fix: 'Harden node inputs and reduce browser-dependent branching.',
      impact: 10,
      autoFix: 'ADD_WAIT_GUARD',
    });
  }

  const bottlenecks: Bottleneck[] = [...nodeTimingStats.entries()]
    .filter(([, stats]) => stats.attempts > 0)
    .map(([nodeId, stats]) => ({
      nodeId,
      label: nodeLabelMap.get(nodeId) ?? nodeId,
      avgDurationMs: stats.totalDurationMs / stats.attempts,
    }))
    .sort((a, b) => b.avgDurationMs - a.avgDurationMs)
    .slice(0, 5);

  const nodeRisks: NodeRisk[] = [...nodeRiskMap.entries()]
    .map(([nodeId, probability]) => {
      const node = safeNodes.find((item) => item.id === nodeId);
      const type = getTaskType(node as AppNode) ?? TaskType.DELAY;
      return {
        nodeId,
        label: nodeLabelMap.get(nodeId) ?? nodeId,
        type,
        failureProbability: probability,
      };
    })
    .sort((a, b) => b.failureProbability - a.failureProbability);

  const edgeDensity =
    safeNodes.length > 1 ? safeEdges.length / (safeNodes.length * (safeNodes.length - 1)) : 0;
  const averageOutDegree = safeNodes.length > 0 ? safeEdges.length / safeNodes.length : 0;
  const complexityPenalty =
    safeNodes.length * 1.5 + maxPhaseWidth * 4 + edgeDensity * 30 + averageOutDegree * 8;
  const complexityScore = Math.round(clamp(100 - complexityPenalty, 5, 100));

  const impactPenalty = issues.reduce((sum, issue) => sum + issue.impact, 0);
  const maintainabilityScore = Math.round(clamp(100 - impactPenalty * 0.9, 5, 100));
  const resilienceScore = Math.round(clamp(predictedSuccessRate, 5, 100));
  const overallScore = Math.round(
    clamp(resilienceScore * 0.5 + maintainabilityScore * 0.3 + complexityScore * 0.2, 5, 100)
  );

  const normalizedIssues = issues
    .map((issue) => ({
      ...issue,
      level: issue.level ?? toRiskLevel(issue.impact),
    }))
    .sort((a, b) => b.impact - a.impact);

  const recommendations = normalizedIssues
    .slice(0, 5)
    .map((issue) => issue.fix)
    .filter((value, index, list) => list.indexOf(value) === index);

  return {
    fingerprint,
    generatedAt: new Date().toISOString(),
    simulationRuns,
    metrics: {
      overallScore,
      resilienceScore,
      maintainabilityScore,
      complexityScore,
      predictedSuccessRate,
      p50DurationMs: Math.round(p50DurationMs),
      p95DurationMs: Math.round(p95DurationMs),
      estimatedCreditsPerRun: totalCredits,
      nodeCount: safeNodes.length,
      edgeCount: safeEdges.length,
      phaseCount: phases.length,
      maxPhaseWidth,
    },
    issues: normalizedIssues,
    recommendations,
    bottlenecks,
    nodeRisks,
  };
}
