'use server';

import { auth } from '@clerk/nextjs/server';
import { unstable_cache } from 'next/cache';

import prisma from '@/lib/prisma';

// Cached credits lookup with 60-second revalidation
const getCachedCredits = (userId: string) =>
  unstable_cache(
    async () => {
      const balance = await prisma.userBalance.findUnique({
        where: { userId },
      });

      if (!balance) {
        // If no balance record exists, create one with initial 100 credits
        const newBalance = await prisma.userBalance.create({
          data: { userId, credits: 100 },
        });
        return newBalance.credits;
      }

      return balance.credits;
    },
    [`user-credits-${userId}`],
    { revalidate: 60, tags: ['credits'] }
  )();

export async function getAvailableCredits() {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unauthenticated');
  }

  return getCachedCredits(userId);
}
