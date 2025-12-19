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

  for (const workflow of workflows) {
    triggerWorkflow(workflow.id);
  }

  return Response.json({ workflowsToRun: workflows.length }, { status: 200 });
}

function triggerWorkflow(workflowId: string) {
  const triggerApiUrl = getAppUrl(`api/workflows/execute?workflowId=${workflowId}`);

  fetch(triggerApiUrl, {
    headers: {
      Authorization: `Bearer ${process.env.API_SECRET!}`,
    },
    cache: 'no-store',
  }).catch((error) => console.log('Error triggering workflow with id', workflowId, ':error->', error.message));
}
