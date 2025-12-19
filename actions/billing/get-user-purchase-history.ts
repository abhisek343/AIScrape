'use server';

import { auth } from '@clerk/nextjs/server';

import prisma from '@/lib/prisma';

export async function getUserPurchaseHistory() {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unauthenticated');
  }

  return prisma.userPurchase.findMany({
    where: { userId },
    orderBy: {
      date: 'desc',
    },
  });
}
