'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

import prisma from '@/lib/prisma';

export async function deleteWorkflows(ids: string[]) {
    const { userId } = auth();

    if (!userId) {
        throw new Error('Unauthenticated');
    }

    if (!ids || ids.length === 0) {
        throw new Error('No workflow IDs provided');
    }

    await prisma.workflow.deleteMany({
        where: {
            id: { in: ids },
            userId, // Ensure user can only delete their own workflows
        },
    });

    revalidatePath('/workflows');
    revalidatePath('/home');
}
