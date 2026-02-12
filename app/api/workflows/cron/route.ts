import { timingSafeEqual } from 'crypto';

import prisma from '@/lib/prisma';
import { getAppUrl } from '@/lib/helper/app-url';
import { WorkflowStatus } from '@/types/workflow';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isValidSecret(secret: string): boolean {
  const API_SECRET = process.env.API_SECRET;
  if (!API_SECRET) return false;
  if (!secret || typeof secret !== 'string' || secret.length < 16) return false;
  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(API_SECRET));
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  // Authenticate the request
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const secret = authHeader.split(' ')[1];
  if (!isValidSecret(secret)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const workflows = await prisma.workflow.findMany({
    select: { id: true },
    where: {
      status: WorkflowStatus.PUBLISHED,
      cron: { not: null },
      nextRunAt: { lte: now },
    },
  });

  const results = await Promise.allSettled(
    workflows.map((w: { id: string }) => triggerWorkflow(w.id))
  );
  
  // Log failures for monitoring
  const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failures.length > 0) {
    console.error(`Failed to trigger ${failures.length} workflows:`,
      failures.map(f => f.reason));
  }

  return Response.json({
    workflowsToRun: workflows.length,
    triggered: results.filter(r => r.status === 'fulfilled').length,
    failed: failures.length
  }, { status: 200 });
}

async function triggerWorkflow(workflowId: string) {
  const triggerApiUrl = getAppUrl(`api/workflows/execute?workflowId=${workflowId}`);

  try {
    const response = await fetch(triggerApiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.API_SECRET!}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error triggering workflow with id', workflowId, ':error->', error.message);
    throw error; // Re-throw to allow Promise.allSettled to catch it
  }
}
