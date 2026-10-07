import prisma from '@/lib/prisma';
import { ExecutionPhaseStatus, WorkflowExecutionStatus } from '@/types/workflow';

export async function markWorkflowExecutionTerminalFailure(
  workflowId: string,
  executionId: string,
): Promise<void> {
  const completedAt = new Date();

  await prisma.$transaction([
    prisma.executionPhase.updateMany({
      where: {
        workflowExecutionId: executionId,
        status: ExecutionPhaseStatus.RUNNING,
      },
      data: {
        status: ExecutionPhaseStatus.FAILED,
        completedAt,
      },
    }),
    prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: WorkflowExecutionStatus.FAILED,
        completedAt,
      },
    }),
    prisma.workflow.updateMany({
      where: {
        id: workflowId,
        lastRunId: executionId,
      },
      data: {
        lastRunStatus: WorkflowExecutionStatus.FAILED,
        lastRunAt: completedAt,
      },
    }),
  ]);
}
