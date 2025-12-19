'use server';

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { WorkflowStatus } from '@/types/workflow';

export async function getDashboardStats() {
    const { userId } = auth();
    if (!userId) {
        throw new Error('Unauthenticated');
    }

    const [
        userBalance,
        workflows,
        executions
    ] = await Promise.all([
        // Get Credits
        prisma.userBalance.findUnique({
            where: { userId },
        }),
        // Get Workflows count
        prisma.workflow.findMany({
            where: { userId },
            select: { id: true }
        }),
        // Get Executions count
        prisma.workflowExecution.findMany({
            where: { userId },
            select: { creditsConsumed: true }
        })
    ]);

    const stats = {
        credits: userBalance?.credits || 0,
        workflows: workflows.length,
        executions: executions.length,
        spent: executions.reduce((acc, exec) => acc + exec.creditsConsumed, 0)
    };

    return stats;
}
