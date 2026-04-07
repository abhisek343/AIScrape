import { Edge } from '@xyflow/react';

import prisma from '@/lib/prisma';
import { analyzeWorkflowChaos, WorkflowChaosReport } from '@/lib/workflow/chaos-lab';
import { safeJsonParse } from '@/lib/safe-json';
import { AppNode } from '@/types/appnode';

export function buildChaosReportFromDefinition(
  definition: string,
  simulationRuns = 180
): WorkflowChaosReport | null {
  const parseResult = safeJsonParse(definition, {
    maxSize: 5 * 1024 * 1024,
    maxDepth: 50,
  });

  if (!parseResult.success) {
    return null;
  }

  const parsed = parseResult.data as { nodes?: unknown; edges?: unknown };
  if (!Array.isArray(parsed.edges)) {
    return null;
  }

  const nodes = (Array.isArray(parsed.nodes) ? parsed.nodes : []) as AppNode[];
  const edges = parsed.edges as Edge[];

  return analyzeWorkflowChaos(nodes, edges, simulationRuns);
}

export function getChaosSnapshotUpdateData(report: WorkflowChaosReport) {
  return {
    chaosSnapshot: JSON.stringify(report),
    chaosScore: report.metrics.overallScore,
    chaosPredictedSuccess: report.metrics.predictedSuccessRate,
    chaosP95DurationMs: report.metrics.p95DurationMs,
    chaosFingerprint: report.fingerprint,
    chaosGeneratedAt: new Date(report.generatedAt),
  };
}

export async function persistChaosSnapshotForExecution(
  executionId: string,
  report: WorkflowChaosReport
): Promise<boolean> {
  try {
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: getChaosSnapshotUpdateData(report),
    });
    return true;
  } catch (error) {
    console.error(`Failed to persist chaos snapshot for execution ${executionId}:`, error);
    return false;
  }
}
