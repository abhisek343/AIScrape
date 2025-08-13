import { timingSafeEqual } from 'crypto';
import parser from 'cron-parser';

import prisma from '@/lib/prisma';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { executeWorkflow } from '@/lib/workflow/execute-workflow';
import { safeJsonParse, validateJsonSchema } from '@/lib/safe-json';
import {
  ExecutionPhaseStatus,
  WorkflowExecutionPlan,
  WorkflowExecutionStatus,
  WorkflowExecutionTrigger,
  WorkflowStatus,
} from '@/types/workflow';

export const dynamic = 'force-dynamic';

// Rate limiting: Track recent requests per workflow
const recentExecutions = new Map<string, number[]>();
const MAX_EXECUTIONS_PER_HOUR = 60; // Maximum 60 executions per hour per workflow
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function isValidSecret(secret: string) {
  const API_SECRET = process.env.API_SECRET;
  if (!API_SECRET) return false;

  // Validate secret format
  if (!secret || typeof secret !== 'string' || secret.length < 16) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(API_SECRET));
  } catch (error) {
    return false;
  }
}

function checkRateLimit(workflowId: string): { allowed: boolean; error?: string } {
  const now = Date.now();
  const executions = recentExecutions.get(workflowId) || [];
  
  // Clean old executions outside the window
  const recentExecs = executions.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentExecs.length >= MAX_EXECUTIONS_PER_HOUR) {
    return {
      allowed: false,
      error: `Rate limit exceeded: ${MAX_EXECUTIONS_PER_HOUR} executions per hour allowed`
    };
  }
  
  // Add current execution timestamp
  recentExecs.push(now);
  recentExecutions.set(workflowId, recentExecs);
  
  // Clean up old entries to prevent memory leak
  if (recentExecutions.size > 10000) {
    const oldestEntries = Array.from(recentExecutions.entries())
      .sort((a, b) => Math.min(...a[1]) - Math.min(...b[1]))
      .slice(0, 1000);
    
    for (const [id] of oldestEntries) {
      recentExecutions.delete(id);
    }
  }
  
  return { allowed: true };
}

export async function GET(req: Request) {
  try {
    // Authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Unauthorized cron execution attempt: missing or invalid auth header');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = authHeader.split(' ')[1];
    if (!isValidSecret(secret)) {
      console.warn('Unauthorized cron execution attempt: invalid secret');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parameter validation
    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get('workflowId');
    
    if (!workflowId || typeof workflowId !== 'string' || workflowId.length === 0) {
      return Response.json({ error: 'Missing or invalid workflowId parameter' }, { status: 400 });
    }

    // Validate workflow ID format (basic CUID validation)
    if (!/^[a-z0-9]{25}$/.test(workflowId)) {
      return Response.json({ error: 'Invalid workflowId format' }, { status: 400 });
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(workflowId);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for workflow ${workflowId}: ${rateLimitResult.error}`);
      return Response.json({ error: rateLimitResult.error }, { status: 429 });
    }

    // Get workflow with validation
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: {
        id: true,
        userId: true,
        status: true,
        cron: true,
        executionPlan: true,
        definition: true,
        creditsCost: true
      }
    });

    if (!workflow) {
      console.warn(`Workflow not found: ${workflowId}`);
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Validate workflow is published and has cron
    if (workflow.status !== WorkflowStatus.PUBLISHED) {
      console.warn(`Attempted to execute non-published workflow: ${workflowId}`);
      return Response.json({ error: 'Workflow not published' }, { status: 400 });
    }

    if (!workflow.cron) {
      console.warn(`Attempted to execute workflow without cron schedule: ${workflowId}`);
      return Response.json({ error: 'Workflow has no cron schedule' }, { status: 400 });
    }

    if (!workflow.executionPlan) {
      console.warn(`Workflow missing execution plan: ${workflowId}`);
      return Response.json({ error: 'Workflow has no execution plan' }, { status: 400 });
    }

    // Safely parse execution plan
    const executionPlanResult = safeJsonParse(workflow.executionPlan, {
      maxSize: 5 * 1024 * 1024, // 5MB limit
      maxDepth: 20
    });

    if (!executionPlanResult.success) {
      console.error(`Failed to parse execution plan for workflow ${workflowId}: ${executionPlanResult.error}`);
      return Response.json({ error: 'Invalid execution plan' }, { status: 500 });
    }

    const executionPlan = executionPlanResult.data as WorkflowExecutionPlan;

    // Validate execution plan structure
    if (!Array.isArray(executionPlan) || executionPlan.length === 0) {
      console.error(`Invalid execution plan structure for workflow ${workflowId}`);
      return Response.json({ error: 'Invalid execution plan structure' }, { status: 500 });
    }

    // Validate and calculate next run time
    const cron = parser.parseExpression(workflow.cron, { utc: true });
    const nextRun = cron.next().toDate();

    console.log(`Executing workflow ${workflowId} for user ${workflow.userId}, next run: ${nextRun}`);

    // Create execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        userId: workflow.userId,
        definition: workflow.definition,
        status: WorkflowExecutionStatus.PENDING,
        startedAt: new Date(),
        trigger: WorkflowExecutionTrigger.CRON,
        phases: {
          create: executionPlan.flatMap((phase) => {
            return phase.nodes.flatMap((node) => {
              return {
                userId: workflow.userId,
                status: ExecutionPhaseStatus.CREATED,
                number: phase.phase,
                node: JSON.stringify(node),
                name: TaskRegistry[node.data.type].label,
              };
            });
          }),
        },
      },
    });

    // Update workflow's next run time
    await prisma.workflow.update({
      where: { id: workflowId },
      data: { nextRunAt: nextRun }
    });

    // Execute workflow in background with proper error handling
    executeWorkflow(execution.id, nextRun)
      .then(() => {
        console.log(`Cron workflow execution ${execution.id} completed successfully`);
      })
      .catch((error) => {
        console.error(`Cron workflow execution ${execution.id} failed:`, error);
      });

    return Response.json({ 
      success: true, 
      executionId: execution.id,
      nextRun: nextRun.toISOString()
    }, { status: 200 });

  } catch (error: any) {
    console.error('Cron execution API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
