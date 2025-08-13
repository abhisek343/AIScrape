'use server';

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

import prisma from '@/lib/prisma';

export async function setupUser() {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unauthenticated');
  }

  const balance = await prisma.userBalance.findUnique({
    where: { userId },
  });

  if (!balance) {
    // Free 100 credits
    await prisma.userBalance.create({
      data: { userId, credits: 100 },
    });
  }

  redirect('/');
}
