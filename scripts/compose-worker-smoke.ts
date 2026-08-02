import prisma from '../lib/prisma';
import {
  submitWorkflowToQueue,
  workflowDeadLetterQueue,
  workflowQueue,
} from '../lib/queue/workflow.queue';
import { redisConnection } from '../lib/queue/client';
import {
  ExecutionPhaseStatus,
  WorkflowExecutionStatus,
  WorkflowExecutionTrigger,
  WorkflowStatus,
} from '../types/workflow';
import { TaskType } from '../types/task';
import { TaskRegistry } from '../lib/workflow/task/registry';

const userId = 'compose-worker-smoke-user';
const smokeUrl = process.env.WORKER_SMOKE_URL ?? 'https://www.iana.org/domains/example';
const timeoutMs = 180_000;

const browserNode = {
  id: 'compose-smoke-browser',
  type: 'default',
  position: { x: 0, y: 0 },
  data: {
    type: TaskType.LAUNCH_BROWSER,
    inputs: {
      'Website Url': smokeUrl,
      Timeout: '30000',
    },
  },
};

const htmlNode = {
  id: 'compose-smoke-html',
  type: 'default',
  position: { x: 300, y: 0 },
  data: {
    type: TaskType.PAGE_TO_HTML,
    inputs: {},
  },
};

const edge = {
  id: 'compose-smoke-edge',
  source: browserNode.id,
  target: htmlNode.id,
  sourceHandle: 'Web page',
  targetHandle: 'Web page',
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function closeQueueConnections() {
  await workflowQueue.close().catch(() => undefined);
  await workflowDeadLetterQueue.close().catch(() => undefined);
  await redisConnection.quit().catch(() => undefined);
  await prisma.$disconnect().catch(() => undefined);
}

async function main() {
  let workflowId: string | undefined;

  try {
    await prisma.userBalance.upsert({
      where: { userId },
      create: { userId, credits: 7 },
      update: { credits: 7 },
    });

    const definition = JSON.stringify({ nodes: [browserNode, htmlNode], edges: [edge] });
    const executionPlan = JSON.stringify([
      { phase: 1, nodes: [browserNode] },
      { phase: 2, nodes: [htmlNode] },
    ]);

    const workflow = await prisma.workflow.create({
      data: {
        userId,
        name: `compose-worker-smoke-${Date.now()}`,
        description: 'Ephemeral CI worker and Puppeteer smoke workflow',
        definition,
        executionPlan,
        creditsCost: 7,
        status: WorkflowStatus.PUBLISHED,
      },
    });
    workflowId = workflow.id;

    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        userId,
        status: WorkflowExecutionStatus.PENDING,
        trigger: WorkflowExecutionTrigger.MANUAL,
        definition,
        phases: {
          create: [
            {
              userId,
              status: ExecutionPhaseStatus.PENDING,
              number: 1,
              node: JSON.stringify(browserNode),
              name: TaskRegistry[TaskType.LAUNCH_BROWSER].label,
            },
            {
              userId,
              status: ExecutionPhaseStatus.PENDING,
              number: 2,
              node: JSON.stringify(htmlNode),
              name: TaskRegistry[TaskType.PAGE_TO_HTML].label,
            },
          ],
        },
      },
    });

    await submitWorkflowToQueue(workflow.id, execution.id);

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const current = await prisma.workflowExecution.findUnique({
        where: { id: execution.id },
        include: { phases: { include: { logs: true }, orderBy: { number: 'asc' } } },
      });

      if (!current) throw new Error('Smoke execution disappeared');
      const phases = current.phases as Array<{
        number: number;
        status: string;
        outputs: string | null;
        logs: Array<{ message: string }>;
      }>;
      if (current.status === WorkflowExecutionStatus.FAILED) {
        const details = phases.map((phase) => ({
          phase: phase.number,
          status: phase.status,
          logs: phase.logs.map((log) => log.message),
        }));
        throw new Error(`Worker smoke execution failed: ${JSON.stringify(details)}`);
      }
      if (current.status === WorkflowExecutionStatus.COMPLETED) {
        const htmlPhase = phases.find((phase) => phase.number === 2);
        const outputs = JSON.parse(htmlPhase?.outputs ?? '{}') as { Html?: unknown };
        if (typeof outputs.Html !== 'string' || !/<html/i.test(outputs.Html)) {
          throw new Error('Worker smoke completed without HTML output');
        }
        console.log(JSON.stringify({
          event: 'compose-worker-smoke.completed',
          executionId: execution.id,
          url: smokeUrl,
          htmlBytes: Buffer.byteLength(outputs.Html, 'utf8'),
        }));
        return;
      }
      await sleep(2_000);
    }

    throw new Error(`Worker smoke timed out after ${timeoutMs}ms`);
  } finally {
    if (workflowId) {
      await prisma.workflow.delete({ where: { id: workflowId } }).catch(() => undefined);
    }
    await prisma.userBalance.delete({ where: { userId } }).catch(() => undefined);
    await closeQueueConnections();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
