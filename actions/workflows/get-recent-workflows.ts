'use server';

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function getRecentWorkflows() {
    const { userId } = auth();

    if (!userId) {
        throw new Error('Unauthenticated');
    }

    return prisma.workflow.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5, // Fetch top 5 recent workflows
    });
}
