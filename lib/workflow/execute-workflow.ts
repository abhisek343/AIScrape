import 'server-only';
import { revalidatePath } from 'next/cache';
import { ExecutionPhase } from '@prisma/client';
import { Browser, Page } from 'puppeteer';
import { Edge } from '@xyflow/react';

import prisma from '@/lib/prisma';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { ExecutorRegistry } from '@/lib/workflow/executor/registry';
import { createLogCollector } from '@/lib/log';
import { safeJsonParse, validateJsonSchema } from '@/lib/safe-json';
import { ExecutionPhaseStatus, WorkflowExecutionStatus } from '@/types/workflow';
import { AppNode } from '@/types/appnode';
import { Environment, ExecutionEnvironment } from '@/types/executor';
import { TaskParamType } from '@/types/task';
import { LogCollector } from '@/types/log';

export async function executeWorkflow(executionId: string, nextRunAt?: Date) {
  const execution = await prisma.workflowExecution.findUnique({
    where: { id: executionId },
    include: {
      workflow: true,
      phases: { orderBy: [{ number: 'asc' }] },
    },
  });

  if (!execution) {
    throw new Error('execution not found');
  }

  // Safely parse workflow definition
  const definitionParseResult = safeJsonParse(execution.definition, {
    maxSize: 5 * 1024 * 1024, // 5MB limit for workflow definitions
    maxDepth: 20
  });

  if (!definitionParseResult.success) {
    throw new Error(`Failed to parse workflow definition: ${definitionParseResult.error}`);
  }

  // Validate workflow definition structure
  const definitionValidation = validateJsonSchema(definitionParseResult.data, {
    type: 'object',
    required: ['edges'],
    properties: {
      edges: { type: 'array' },
      nodes: { type: 'array' }
    }
  });

  if (!definitionValidation.valid) {
    throw new Error(`Invalid workflow definition structure: ${definitionValidation.error}`);
  }

  const edges = definitionParseResult.data.edges as Edge[];

  const environment: Environment = { phases: {}, userId: execution.userId };

  await initializeWorkflowExecution(execution.id, execution.workflowId, nextRunAt);
  await initializePhaseStatuses(execution);

  let creditsConsumed = 0;
  let executionFailed = false;
  for (const phase of execution.phases) {
    const phaseExecution = await executeWorkflowPhase(phase, environment, edges, execution.userId);

    creditsConsumed += phaseExecution.creditsConsumed;

    if (!phaseExecution.success) {
      executionFailed = true;
      break;
    }
  }

  await finalizeWorkflowExecution(executionId, execution.workflowId, executionFailed, creditsConsumed);
  await cleanupEnvironment(environment);

  revalidatePath('/workflow/runs');
}

async function initializeWorkflowExecution(executionId: string, workflowId: string, nextRunAt?: Date) {
  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: {
      startedAt: new Date(),
      status: WorkflowExecutionStatus.RUNNING,
    },
  });

  await prisma.workflow.update({
    where: { id: workflowId },
    data: {
      lastRunAt: new Date(),
      lastRunStatus: WorkflowExecutionStatus.RUNNING,
      lastRunId: executionId,
      ...(nextRunAt && { nextRunAt }),
    },
  });
}

async function initializePhaseStatuses(execution: any) {
  await prisma.executionPhase.updateMany({
    where: {
      id: {
        in: execution.phases.map((phase: any) => phase.id),
      },
    },
    data: {
      status: ExecutionPhaseStatus.PENDING,
    },
  });
}

async function finalizeWorkflowExecution(
  executionId: string,
  workflowId: string,
  executionFailed: boolean,
  creditsConsumed: number
) {
  const finalStatus = executionFailed ? WorkflowExecutionStatus.FAILED : WorkflowExecutionStatus.COMPLETED;

  try {
    // Update execution status (this should always succeed)
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        creditsConsumed,
      },
    });

    // Update workflow status with retry logic for race conditions
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        await prisma.workflow.update({
          where: {
            id: workflowId,
            lastRunId: executionId,
          },
          data: {
            lastRunStatus: finalStatus,
            lastRunAt: new Date(),
          },
        });
        break; // Success, exit retry loop
      } catch (updateError: any) {
        retryCount++;

        if (retryCount >= maxRetries) {
          // Log the error but don't fail the entire execution
          console.warn(`Failed to update workflow status after ${maxRetries} retries:`, {
            workflowId,
            executionId,
            error: updateError.message,
            finalStatus
          });

          // Check if this is a genuine race condition (lastRunId mismatch)
          try {
            const currentWorkflow = await prisma.workflow.findUnique({
              where: { id: workflowId },
              select: { lastRunId: true }
            });

            if (currentWorkflow?.lastRunId !== executionId) {
              console.info(`Workflow ${workflowId} has newer execution ${currentWorkflow?.lastRunId}, skipping status update for ${executionId}`);
            } else {
              console.error(`Unexpected error updating workflow status for ${workflowId}:`, updateError);
            }
          } catch (checkError) {
            console.error(`Failed to check workflow status for ${workflowId}:`, checkError);
          }
          break;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
      }
    }
  } catch (error) {
    console.error(`Critical error in finalizeWorkflowExecution for ${executionId}:`, error);
    throw error; // Re-throw critical errors
  }
}

async function executeWorkflowPhase(phase: ExecutionPhase, environment: Environment, edges: Edge[], userId: string) {
  const logCollector = createLogCollector();
  const startedAt = new Date();

  // Safely parse phase node
  const nodeParseResult = safeJsonParse(phase.node, {
    maxSize: 1024 * 1024, // 1MB limit for individual nodes
    maxDepth: 10
  });

  if (!nodeParseResult.success) {
    logCollector.error(`Failed to parse phase node: ${nodeParseResult.error}`);
    await finalizePhase(phase.id, false, {}, logCollector, 0);
    return { success: false, creditsConsumed: 0 };
  }

  // Validate node structure
  const nodeValidation = validateJsonSchema(nodeParseResult.data, {
    type: 'object',
    required: ['id', 'data'],
    properties: {
      id: { type: 'string' },
      data: { type: 'object' }
    }
  });

  if (!nodeValidation.valid) {
    logCollector.error(`Invalid node structure: ${nodeValidation.error}`);
    await finalizePhase(phase.id, false, {}, logCollector, 0);
    return { success: false, creditsConsumed: 0 };
  }

  const node = nodeParseResult.data as AppNode;

  setupEnvironmentForPhase(node, environment, edges);

  // Update phase status
  await prisma.executionPhase.update({
    where: { id: phase.id },
    data: {
      status: ExecutionPhaseStatus.RUNNING,
      startedAt,
      inputs: JSON.stringify(environment.phases[node.id].inputs),
    },
  });

  const taskDefinition = TaskRegistry[node.data.type];
  if (!taskDefinition) {
    logCollector.error(`Unknown task type: ${node.data.type}`);
    await finalizePhase(phase.id, false, {}, logCollector, 0);
    return { success: false, creditsConsumed: 0 };
  }

  const creditsRequired = taskDefinition.credits ?? 0;

  let success = await decrementCredits(userId, creditsRequired, logCollector);
  const creditsConsumed = success ? creditsRequired : 0;

  if (success) {
    // We can execute the phase if the credits are sufficient
    success = await executePhase(phase, node, environment, logCollector);
  }

  const outputs = environment.phases[node.id].outputs;
  await finalizePhase(phase.id, success, outputs, logCollector, creditsConsumed);

  return { success, creditsConsumed };
}

async function finalizePhase(
  phaseId: string,
  success: boolean,
  outputs: any,
  logCollector: LogCollector,
  creditsConsumed: number
) {
  const finalStatus = success ? ExecutionPhaseStatus.COMPLETED : ExecutionPhaseStatus.FAILED;

  await prisma.executionPhase.update({
    where: { id: phaseId },
    data: {
      status: finalStatus,
      completedAt: new Date(),
      outputs: JSON.stringify(outputs),
      creditsConsumed,
      logs: {
        createMany: {
          data: logCollector.getAll().map((log) => ({
            message: log.message,
            timestamp: log.timestamp,
            logLevel: log.level,
          })),
        },
      },
    },
  });
}

async function executePhase(
  phase: ExecutionPhase,
  node: AppNode,
  environment: Environment,
  logCollector: LogCollector
): Promise<boolean> {
  const runFn = ExecutorRegistry[node.data.type];
  if (!runFn) {
    logCollector.error(`Not found executor for ${node.data.type}`);
    return false;
  }

  const executionEnvironment: ExecutionEnvironment<any> = createExecutionEnvironment(node, environment, logCollector);

  return await runFn(executionEnvironment);
}

function setupEnvironmentForPhase(node: AppNode, environment: Environment, edges: Edge[]) {
  environment.phases[node.id] = { inputs: {}, outputs: {} };

  const taskDef = TaskRegistry[node.data.type];
  if (!taskDef) {
    console.error('Unknown node type in setupEnvironmentForPhase:', node.data.type);
    return;
  }
  const inputs = taskDef.inputs;
  for (const input of inputs) {
    if (input.type === TaskParamType.BROWSER_INSTANCE) continue;

    const inputValue = node.data.inputs[input.name];
    if (inputValue) {
      environment.phases[node.id].inputs[input.name] = inputValue;
      continue;
    }

    // Get input value from outputs in the environment
    const connectedEdge = edges.find((edge) => edge.target === node.id && edge.targetHandle === input.name);

    if (!connectedEdge) {
      console.error('Missing edge for input', input.name, 'node id:', node.id);
      continue;
    }

    const sourcePhase = environment.phases[connectedEdge.source];
    const outputValue = sourcePhase?.outputs?.[connectedEdge.sourceHandle!];
    if (outputValue === undefined || outputValue === null) {
      // Source not executed yet or no output produced
      console.error('Missing output for connected edge', connectedEdge.id || `${connectedEdge.source}->${connectedEdge.target}`);
      continue;
    }

    environment.phases[node.id].inputs[input.name] = outputValue;
  }
}

function createExecutionEnvironment(
  node: AppNode,
  environment: Environment,
  logCollector: LogCollector
): ExecutionEnvironment<any> {
  return {
    getInput: (name: string) => environment.phases[node.id]?.inputs[name],
    setOutput: (name: string, value: string) => {
      environment.phases[node.id].outputs[name] = value;
    },

    getBrowser: () => environment.browser,
    setBrowser: (browser: Browser) => (environment.browser = browser),

    getPage: () => environment.page,
    setPage: (page: Page) => (environment.page = page),

    getUserId: () => environment.userId,

    log: logCollector,
  };
}

async function decrementCredits(userId: string, amount: number, logCollector: LogCollector) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Use a transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx: any) => {
        // Atomic update: only decrement if credits >= amount
        // updateMany returns { count: n }
        const updateResult = await tx.userBalance.updateMany({
          where: {
            userId,
            credits: { gte: amount }
          },
          data: {
            credits: { decrement: amount }
          }
        });

        if (updateResult.count === 0) {
          throw new Error('Insufficient credits');
        }

        // Return new balance for logging (optional, requires extra read if needed, or we just trust it worked)
        // For logging purposes we can fetch it, but strictly speaking the atomic action is done.
        return true;
      });

      logCollector.info(`Credits decremented successfully from atomic balance.`);
      return true;

    } catch (error: any) {
      retryCount++;

      if (error.message === 'Insufficient credits') {
        logCollector.error('Insufficient balance');
        return false;
      }

      if (retryCount >= maxRetries) {
        logCollector.error(`Cannot decrement credits after ${maxRetries} attempts: ${error.message}`);
        return false;
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
    }
  }

  return false;
}

async function cleanupEnvironment(environment: Environment) {
  const cleanupPromises: Promise<void>[] = [];

  try {
    // Close all pages first
    if (environment.browser) {
      try {
        const pages = await environment.browser.pages();
        for (const page of pages) {
          cleanupPromises.push(
            page.close().catch((err) =>
              console.error('Cannot close page, reason:', err)
            )
          );
        }
      } catch (err) {
        console.error('Error getting browser pages:', err);
      }
    }

    // Wait for all pages to close
    await Promise.allSettled(cleanupPromises);

    // Then close/disconnect browser
    if (environment.browser) {
      if (process.env.NODE_ENV !== 'production') {
        // Close locally in dev
        await environment.browser.close().catch((err) =>
          console.error('Cannot close browser, reason:', err)
        );
      } else {
        // Disconnect from brightdata in prod
        await environment.browser.disconnect().catch((err) =>
          console.error('Cannot disconnect browser, reason:', err)
        );
      }
    }

    // Clear environment references
    environment.browser = undefined;
    environment.page = undefined;
    environment.phases = {};

  } catch (error) {
    console.error('Error during environment cleanup:', error);
  }
}
