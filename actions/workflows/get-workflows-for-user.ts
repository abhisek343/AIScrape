'use server';

import { auth } from '@clerk/nextjs/server';
import { unstable_cache } from 'next/cache';

import prisma from '@/lib/prisma';

// Cached query function with 30-second revalidation
const getCachedWorkflowsForUser = (userId: string) =>
  unstable_cache(
    async () => {
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
    },
    [`user-workflows-${userId}`],
    { revalidate: 30, tags: ['workflows'] }
  )();

export async function getWorkflowsForUser() {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unauthenticated');
  }

  return getCachedWorkflowsForUser(userId);
}
