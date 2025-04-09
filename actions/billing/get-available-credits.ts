'use server';

import { auth } from '@clerk/nextjs/server';

import prisma from '@/lib/prisma';

export async function getAvailableCredits() {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unautheticated');
  }

  const balance = await prisma.userBalanace.findUnique({
    where: { userId },
  });

  if (!balance) {
    // If no balance record exists, create one with initial 100 credits
    const newBalance = await prisma.userBalanace.create({
      data: { userId, credits: 100 },
    });
    return newBalance.credits;
  }

  return balance.credits;
}
