import 'server-only';
import { revalidatePath } from 'next/cache';
import { ExecutionPhase } from '@prisma/client';
import { Browser, Page } from 'puppeteer';
import { Edge } from '@xyflow/react';

import prisma from '@/lib/prisma';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { ExecutorRegistry } from '@/lib/workflow/executor/registry';
import {
  buildChaosReportFromDefinition,
  persistChaosSnapshotForExecution,
} from '@/lib/workflow/chaos-lab-storage';
import {
  buildPhaseNodeIdMap,
  hasInterDependenciesInPhaseGroup,
} from '@/lib/workflow/phase-dependencies';
import { createLogCollector } from '@/lib/log';
import { safeJsonParse, validateJsonSchema } from '@/lib/safe-json';
import { ExecutionPhaseStatus, WorkflowExecutionStatus } from '@/types/workflow';
import { AppNode } from '@/types/appnode';
import { Environment, ExecutionEnvironment } from '@/types/executor';
import { TaskParamType } from '@/types/task';
import { LogCollector } from '@/types/log';

type PhaseExecutionResult = {
  success: boolean;
  creditsConsumed: number;
};

const FAILED_PHASE_RESULT: PhaseExecutionResult = {
  success: false,
  creditsConsumed: 0,
};

type CreditUpdateResult = Array<{ credits: number }>;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

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
    maxDepth: 50
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

  const chaosReport = buildChaosReportFromDefinition(execution.definition, 180);
  if (chaosReport) {
    await persistChaosSnapshotForExecution(execution.id, chaosReport);
  }

  await initializeWorkflowExecution(execution.id, execution.workflowId, nextRunAt);

  let creditsConsumed = 0;
  let executionFailed = false;
  let fatalError: unknown = null;

  try {
    // Group phases by number to execute them in parallel batches
    const phases = execution.phases as ExecutionPhase[];
    const phasesByNumber = phases.reduce<Record<number, ExecutionPhase[]>>((acc, phase) => {
      (acc[phase.number] ??= []).push(phase);
      return acc;
    }, {});

    const sortedPhaseNumbers = Object.keys(phasesByNumber)
      .map(Number)
      .sort((a, b) => a - b);
    const phaseNodeIdMap = buildPhaseNodeIdMap(phases);

    for (const phaseNumber of sortedPhaseNumbers) {
      const phasesInGroup = phasesByNumber[phaseNumber];

      // Validate that phases in the same group don't have dependencies on each other
      // This ensures parallel execution is safe
      const hasInterDependencies = hasInterDependenciesInPhaseGroup(
        phasesInGroup,
        edges,
        phaseNodeIdMap
      );
      const hasSharedBrowserContext = phaseGroupUsesSharedBrowserContext(phasesInGroup);
      const executeSequentially = hasInterDependencies || hasSharedBrowserContext;

      if (executeSequentially) {
        console.warn(
          `Phase group ${phaseNumber} will execute sequentially (inter-dependencies: ${hasInterDependencies}, shared browser context: ${hasSharedBrowserContext}).`
        );
      }

      const groupResult = await executePhaseGroup(
        phasesInGroup,
        environment,
        edges,
        execution.userId,
        executeSequentially
      );
      creditsConsumed += groupResult.creditsConsumed;

      if (!groupResult.success) {
        executionFailed = true;
        break;
      }
    }
  } catch (error: unknown) {
    executionFailed = true;
    fatalError = error;
    console.error(`Workflow execution ${executionId} failed unexpectedly:`, error);
  } finally {
    try {
      await finalizeWorkflowExecution(executionId, execution.workflowId, executionFailed, creditsConsumed);
    } catch (error: unknown) {
      console.error(`Failed to finalize workflow execution ${executionId}:`, error);
      await markExecutionFailedFallback(executionId, execution.workflowId, creditsConsumed);
      if (!fatalError) {
        fatalError = error;
      }
    } finally {
      await cleanupEnvironment(environment);
    }
  }

  revalidatePath('/workflow/runs');

  if (fatalError) {
    throw fatalError instanceof Error ? fatalError : new Error(String(fatalError));
  }
}

async function initializeWorkflowExecution(executionId: string, workflowId: string, nextRunAt?: Date) {
  const now = new Date();
  
  // Use a transaction to ensure both updates succeed or fail together
  // This maintains consistency between execution and workflow status
  await prisma.$transaction([
    prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        startedAt: now,
        status: WorkflowExecutionStatus.RUNNING,
      },
    }),
    prisma.workflow.update({
      where: { id: workflowId },
      data: {
        lastRunAt: now,
        lastRunStatus: WorkflowExecutionStatus.RUNNING,
        lastRunId: executionId,
        ...(nextRunAt && { nextRunAt }),
      },
    }),
  ]);
}

async function executePhaseGroup(
  phasesInGroup: ExecutionPhase[],
  environment: Environment,
  edges: Edge[],
  userId: string,
  executeSequentially: boolean
): Promise<PhaseExecutionResult> {
  if (phasesInGroup.length === 0) {
    return { success: true, creditsConsumed: 0 };
  }

  if (executeSequentially) {
    let creditsConsumed = 0;
    for (const phase of phasesInGroup) {
      const result = await executeWorkflowPhase(phase, environment, edges, userId);
      creditsConsumed += result.creditsConsumed;
      if (!result.success) {
        return { success: false, creditsConsumed };
      }
    }
    return { success: true, creditsConsumed };
  }

  const phaseExecutions = await Promise.all(
    phasesInGroup.map((phase) => executeWorkflowPhase(phase, environment, edges, userId))
  );

  return {
    success: phaseExecutions.every((result) => result.success),
    creditsConsumed: phaseExecutions.reduce((acc, result) => acc + result.creditsConsumed, 0),
  };
}

function phaseGroupUsesSharedBrowserContext(phasesInGroup: ExecutionPhase[]): boolean {
  for (const phase of phasesInGroup) {
    const parsedPhaseNode = safeJsonParse(phase.node, {
      maxSize: 1024 * 1024,
      maxDepth: 10,
    });

    if (!parsedPhaseNode.success) {
      return true;
    }

    const nodeType = (parsedPhaseNode.data as { data?: { type?: unknown } })?.data?.type;
    if (typeof nodeType !== 'string') {
      return true;
    }

    const taskDefinition = TaskRegistry[nodeType as keyof typeof TaskRegistry];
    if (!taskDefinition) {
      return true;
    }

    const usesBrowserContext = [...taskDefinition.inputs, ...taskDefinition.outputs].some(
      (param) => param.type === TaskParamType.BROWSER_INSTANCE
    );
    if (usesBrowserContext) {
      return true;
    }
  }

  return false;
}

async function finalizeWorkflowExecution(
  executionId: string,
  workflowId: string,
  executionFailed: boolean,
  creditsConsumed: number
) {
  const finalStatus = executionFailed ? WorkflowExecutionStatus.FAILED : WorkflowExecutionStatus.COMPLETED;
  const now = new Date();

  try {
    // Use a transaction to ensure both execution and workflow status are updated atomically
    // This prevents the invariant violation where execution shows COMPLETED but workflow shows RUNNING
    await prisma.$transaction([
      // Update execution status
      prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: finalStatus,
          completedAt: now,
          creditsConsumed,
        },
      }),
      // Update workflow status - only if this is still the most recent execution
      prisma.workflow.updateMany({
        where: {
          id: workflowId,
          lastRunId: executionId, // Only update if no newer execution has started
        },
        data: {
          lastRunStatus: finalStatus,
          lastRunAt: now,
        },
      }),
    ]);

    // Check if the workflow was updated (if not, a newer execution has taken over)
    const updatedWorkflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { lastRunId: true, lastRunStatus: true }
    });

    if (updatedWorkflow?.lastRunId !== executionId) {
      console.info(`Workflow ${workflowId} has newer execution ${updatedWorkflow?.lastRunId}, status update for ${executionId} was skipped`);
    }
  } catch (error: unknown) {
    console.error(`Critical error in finalizeWorkflowExecution for ${executionId}:`, error);
    throw error; // Re-throw critical errors
  }
}

async function markExecutionFailedFallback(
  executionId: string,
  workflowId: string,
  creditsConsumed: number
) {
  const now = new Date();

  try {
    await prisma.$transaction([
      prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: WorkflowExecutionStatus.FAILED,
          completedAt: now,
          creditsConsumed,
        },
      }),
      prisma.workflow.updateMany({
        where: {
          id: workflowId,
          lastRunId: executionId,
        },
        data: {
          lastRunStatus: WorkflowExecutionStatus.FAILED,
          lastRunAt: now,
        },
      }),
    ]);
  } catch (error: unknown) {
    console.error(`Fallback status update failed for execution ${executionId}:`, error);
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
    return failPhaseExecution(phase.id, logCollector, `Failed to parse phase node: ${nodeParseResult.error}`);
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
    return failPhaseExecution(phase.id, logCollector, `Invalid node structure: ${nodeValidation.error}`);
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
    return failPhaseExecution(phase.id, logCollector, `Unknown task type: ${node.data.type}`);
  }

  const creditsRequired = taskDefinition.credits ?? 0;

  let success = creditsRequired === 0 || await decrementCredits(userId, creditsRequired, logCollector);
  const creditsConsumed = success ? creditsRequired : 0;

  if (success) {
    // We can execute the phase if the credits are sufficient
    success = await executePhase(node, environment, logCollector);
  }

  const outputs = environment.phases[node.id].outputs;
  await finalizePhase(phase.id, success, outputs, logCollector, creditsConsumed);

  return { success, creditsConsumed };
}

async function failPhaseExecution(
  phaseId: string,
  logCollector: LogCollector,
  message: string
): Promise<PhaseExecutionResult> {
  logCollector.error(message);
  await finalizePhase(phaseId, false, {}, logCollector, 0);
  return FAILED_PHASE_RESULT;
}

async function finalizePhase(
  phaseId: string,
  success: boolean,
  outputs: Record<string, string>,
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

  return runFn(executionEnvironment);
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
    if (inputValue !== undefined && inputValue !== null) {
      environment.phases[node.id].inputs[input.name] = inputValue;
      continue;
    }

    // Get input value from outputs in the environment
    const connectedEdge = edges.find((edge) => edge.target === node.id && edge.targetHandle === input.name);

    if (!connectedEdge) {
      console.error('Missing edge for input', input.name, 'node id:', node.id);
      continue;
    }

    // Validate sourceHandle exists before using it
    if (!connectedEdge.sourceHandle) {
      console.error('Edge missing source handle:', connectedEdge.id || `${connectedEdge.source}->${connectedEdge.target}`);
      continue;
    }

    const sourcePhase = environment.phases[connectedEdge.source];
    const outputValue = sourcePhase?.outputs?.[connectedEdge.sourceHandle];
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

  // Validate inputs
  if (!userId || typeof userId !== 'string') {
    logCollector.error('Invalid userId provided');
    return false;
  }
  if (!Number.isFinite(amount) || amount < 0) {
    logCollector.error('Invalid amount provided');
    return false;
  }
  if (amount === 0) {
    return true;
  }

  for (let retryCount = 1; retryCount <= maxRetries; retryCount++) {
    try {
      // Use raw query with proper locking for true atomicity
      // This prevents race conditions where multiple concurrent executions
      // could pass the gte check before decrementing
      const result = await prisma.$queryRaw<CreditUpdateResult>`
        UPDATE "UserBalance"
        SET credits = credits - ${amount}
        WHERE "userId" = ${userId} AND credits >= ${amount}
        RETURNING credits
      `;

      if (result.length === 0) {
        logCollector.error('Insufficient balance');
        return false;
      }

      const remainingCredits = result[0].credits;
      logCollector.info(`Credits decremented successfully. Remaining: ${remainingCredits}`);
      return true;

    } catch (error: unknown) {
      // Log detailed error for debugging
      console.error(`Credit decrement attempt ${retryCount} failed:`, {
        userId,
        amount,
        error: getErrorMessage(error),
      });

      if (retryCount >= maxRetries) {
        logCollector.error(`Cannot decrement credits after ${maxRetries} attempts: ${getErrorMessage(error)}`);
        return false;
      }

      // Wait before retry (exponential backoff with jitter)
      const delay = Math.pow(2, retryCount) * 100 + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
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
            page.close().catch((err: Error) =>
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
        await environment.browser.close().catch((err: Error) =>
          console.error('Cannot close browser, reason:', err)
        );
      } else {
        // Disconnect from brightdata in prod
        await environment.browser.disconnect().catch((err: Error) =>
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
