'use server';

import { auth } from '@clerk/nextjs/server';

import prisma from '@/lib/prisma';
import {
  buildChaosReportFromDefinition,
  getChaosSnapshotUpdateData,
} from '@/lib/workflow/chaos-lab-storage';

type WorkflowExecutionListItem = {
  id: string;
  definition: string;
  chaosScore: number | null;
  [key: string]: any;
};

export async function getWorkflowExecutions(workflowId: string) {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unauthenticated');
  }

  const executions = (await prisma.workflowExecution.findMany({
    where: {
      userId,
      workflowId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })) as WorkflowExecutionListItem[];

  const missingSnapshots = executions
    .filter((execution) => execution.chaosScore == null && typeof execution.definition === 'string')
    .slice(0, 8);

  if (missingSnapshots.length > 0) {
    await Promise.allSettled(
      missingSnapshots.map(async (execution) => {
        const report = buildChaosReportFromDefinition(execution.definition, 140);
        if (!report) return;

        const updateData = getChaosSnapshotUpdateData(report);
        Object.assign(execution, updateData);

        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: updateData,
        });
      })
    );
  }

  return executions;
}
