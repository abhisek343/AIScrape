'use server';

import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function getCredentialsForUser() {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unauthenticated');
  }

  return prisma.credential.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
    orderBy: { name: 'asc' },
  });
}
