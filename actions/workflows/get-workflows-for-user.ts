'use server';

import { auth } from '@clerk/nextjs/server';

import prisma from '@/lib/prisma';

export async function getWorkflowsForUser() {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unauthenticated');
  }

  return prisma.workflow.findMany({
    where: { userId },
    select: {
      id: true,
      userId: true,
      name: true,
      description: true,
      status: true,
      creditsCost: true,
      cron: true,
      lastRunAt: true,
      lastRunStatus: true,
      lastRunId: true,
      nextRunAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}
