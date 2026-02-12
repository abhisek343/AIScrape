'use server';

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

import prisma from '@/lib/prisma';
import { safeJsonParse } from '@/lib/safe-json';
import { flowToExecutionPlan } from '@/lib/workflow/execution-plan';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { submitWorkflowToQueue } from '@/lib/queue/workflow.queue';
import {
  ExecutionPhaseStatus,
  WorkflowExecutionPlan,
  WorkflowExecutionStatus,
  WorkflowExecutionTrigger,
  WorkflowStatus,
} from '@/types/workflow';
import { WorkflowExecution } from '@prisma/client';

interface RunWorkflowParams {
  workflowId: string;
  trigger?: WorkflowExecutionTrigger;
  inputs?: Record<string, any>;
  shouldRedirect?: boolean;
  currentFlowDefinition?: string; // New optional parameter for live definition
}

export async function runWorkflow(params: RunWorkflowParams): Promise<WorkflowExecution> {
  const {
    workflowId,
    trigger = WorkflowExecutionTrigger.MANUAL,
    inputs,
    shouldRedirect = true,
    currentFlowDefinition,
  } = params;
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unauthenticated');
  }

  if (!workflowId) {
    throw new Error('workflowId is required');
  }

  const workflow = await prisma.workflow.findUnique({
    where: {
      userId,
      id: workflowId,
    },
  });

  if (!workflow) {
    throw new Error('workflow not found');
  }

  let executionPlan: WorkflowExecutionPlan;
  // Use the stored definition by default, but allow override for drafts
  let definitionToUse = workflow.definition;

  if (workflow.status === WorkflowStatus.PUBLISHED) {
    if (!workflow.executionPlan) {
      throw new Error('no execution plan found in published workflow');
    }
    const execPlanParse = safeJsonParse(workflow.executionPlan, { maxSize: 5 * 1024 * 1024, maxDepth: 50 });
    if (!execPlanParse.success) {
      throw new Error(`Invalid execution plan: ${execPlanParse.error}`);
    }
    executionPlan = execPlanParse.data;
    definitionToUse = workflow.definition;
  } else {
    // For draft workflows, allow using a provided current definition
    if (currentFlowDefinition) {
      definitionToUse = currentFlowDefinition;
    }
    const flowParse = safeJsonParse(definitionToUse, { maxSize: 5 * 1024 * 1024, maxDepth: 50 });
    if (!flowParse.success) {
      throw new Error(`Invalid flow definition: ${flowParse.error}`);
    }
    const flow = flowParse.data;
    
    // Validate structure before processing
    if (!Array.isArray(flow?.nodes) || !Array.isArray(flow?.edges)) {
      throw new Error('Invalid flow definition: nodes and edges must be arrays');
    }
    
    const result = flowToExecutionPlan(flow.nodes, flow.edges);

    if (result.error) {
      throw new Error('flow definition is not valid');
    }

    if (!result.executionPlan) {
      throw new Error('No execution plan generated');
    }

    executionPlan = result.executionPlan;
  }

  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      userId,
      status: WorkflowExecutionStatus.PENDING,
      // Note: startedAt is intentionally left null until actual execution begins
      // This maintains temporal consistency - startedAt reflects actual start time, not queue time
      trigger: trigger,
      definition: definitionToUse, // Use the potentially overridden definition
      phases: {
        create: executionPlan.flatMap((phase) => {
          return phase.nodes.flatMap((node) => {
            return {
              userId,
              status: ExecutionPhaseStatus.PENDING, // Directly set to PENDING, skipping CREATED
              number: phase.phase,
              node: JSON.stringify(node),
              name: TaskRegistry[node.data.type].label,
            };
          });
        }),
      },
      // Store inputs if provided
      ...(inputs && { inputs: JSON.stringify(inputs) }),
    },
  });

  if (!execution) {
    throw new Error('Workflow execution not created');
  }

  // Submit workflow to queue instead of running directly
  try {
    await submitWorkflowToQueue(workflowId, execution.id);
  } catch (error) {
    console.error(`Failed to submit workflow to queue: ${error}`);
    // Optional: Fail the execution immediately if queue submission fails
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: WorkflowExecutionStatus.FAILED,
        completedAt: new Date(),
      },
    });
    throw new Error('Failed to submit workflow');
  }

  if (shouldRedirect) {
    redirect(`/workflow/runs/${workflowId}/${execution.id}`);
  }

  return execution; // Return the created execution object
}
