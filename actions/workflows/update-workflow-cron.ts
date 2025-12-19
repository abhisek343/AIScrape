'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import parser from 'cron-parser';

import prisma from '@/lib/prisma';

// Security: Minimum intervals to prevent DoS
const MIN_INTERVAL_MINUTES = 5; // Minimum 5 minutes between executions
const MAX_EXECUTIONS_PER_DAY = 288; // Maximum 288 executions per day (every 5 minutes)

function validateCronFrequency(cronExpression: string): { valid: boolean; error?: string } {
  try {
    const interval = parser.parseExpression(cronExpression, { utc: true });
    
    // Get next few execution times to analyze frequency
    const executions: Date[] = [];
    let current = interval.next();
    for (let i = 0; i < 10; i++) {
      executions.push(current.toDate());
      current = interval.next();
    }
    
    // Check minimum interval between executions
    for (let i = 1; i < executions.length; i++) {
      const intervalMs = executions[i].getTime() - executions[i - 1].getTime();
      const intervalMinutes = intervalMs / (1000 * 60);
      
      if (intervalMinutes < MIN_INTERVAL_MINUTES) {
        return {
          valid: false,
          error: `Minimum interval between executions is ${MIN_INTERVAL_MINUTES} minutes. Found: ${intervalMinutes.toFixed(1)} minutes`
        };
      }
    }
    
    // Check daily execution limit
    const oneDayMs = 24 * 60 * 60 * 1000;
    const executionsInDay = executions.filter(exec => 
      exec.getTime() <= executions[0].getTime() + oneDayMs
    ).length;
    
    if (executionsInDay > MAX_EXECUTIONS_PER_DAY) {
      return {
        valid: false,
        error: `Maximum ${MAX_EXECUTIONS_PER_DAY} executions per day allowed. This schedule would execute ${executionsInDay} times`
      };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid cron expression format' };
  }
}

export async function updateWorkflowCron({ id, cron }: { id: string; cron: string }) {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unauthenticated');
  }

  // Validate cron expression format
  if (!cron || typeof cron !== 'string' || cron.trim().length === 0) {
    throw new Error('Cron expression is required');
  }

  // Security: Limit cron expression length to prevent DoS
  if (cron.length > 100) {
    throw new Error('Cron expression too long');
  }

  try {
    // Validate cron syntax
    const interval = parser.parseExpression(cron, { utc: true });
    
    // Validate frequency limits
    const frequencyValidation = validateCronFrequency(cron);
    if (!frequencyValidation.valid) {
      throw new Error(`Cron frequency validation failed: ${frequencyValidation.error}`);
    }

    // Check user's current active cron jobs to prevent abuse
    const activeWorkflows = await prisma.workflow.count({
      where: {
        userId,
        cron: { not: null },
        status: 'PUBLISHED'
      }
    });

    const MAX_ACTIVE_CRONS = 10; // Limit active cron workflows per user
    if (activeWorkflows >= MAX_ACTIVE_CRONS) {
      throw new Error(`Maximum ${MAX_ACTIVE_CRONS} active scheduled workflows allowed per user`);
    }

    const nextRunAt = interval.next().toDate();

    // Verify the workflow belongs to the user before updating
    const workflow = await prisma.workflow.findFirst({
      where: { id, userId }
    });

    if (!workflow) {
      throw new Error('Workflow not found or access denied');
    }

    await prisma.workflow.update({
      where: { id, userId },
      data: {
        cron,
        nextRunAt,
      },
    });

    console.log(`Cron schedule updated for workflow ${id}: ${cron}, next run: ${nextRunAt}`);
  } catch (error: any) {
    console.error('Cron update failed:', error.message);
    throw new Error(`Failed to update cron schedule: ${error.message}`);
  }

  revalidatePath('/workflows');
}
