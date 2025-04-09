'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache'; // Added
import { auth } from '@clerk/nextjs/server';
import { Edge } from '@xyflow/react';

import prisma from '@/lib/prisma';
import { createFlowNode } from '@/lib/workflow/create-flow-node';
import { createWorkflowSchema, type createWorkflowSchemaType } from '@/schema/workflows';
import { WorkflowStatus } from '@/types/workflow';
import { AppNode } from '@/types/appnode';
import { TaskType } from '@/types/task';
import { Workflow } from '@prisma/client'; // Import Workflow type from Prisma Client

export async function createWorkflow(
  name: string,
  definition: string,
  description?: string,
  shouldRedirect: boolean = true // New parameter
): Promise<Workflow> {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unauthenticated');
  }

  // Validate inputs (simplified for direct API use, original schema validation is more robust)
  if (!name || !definition) {
    throw new Error('Workflow name and definition are required');
  }

  let uniqueName = name;
  let counter = 1;
  let existingWorkflow = await prisma.workflow.findUnique({
    where: {
      name_userId: {
        name: uniqueName,
        userId,
      },
    },
  });

  while (existingWorkflow) {
    uniqueName = `${name} (${counter})`;
    counter++;
    existingWorkflow = await prisma.workflow.findUnique({
      where: {
      name_userId: {
        name: uniqueName,
        userId,
      },
      },
    });
  }

  const result = await prisma.workflow.create({
    data: {
      userId,
      status: WorkflowStatus.DRAFT,
      name: uniqueName, // Use the unique name
      description,
      definition,
    },
  });

  if (!result) {
    throw new Error('Failed to create workflow');
  }

  if (shouldRedirect) {
    redirect(`/workflow/editor/${result.id}`);
  } else {
    // If not redirecting (e.g., called from API), revalidate the path
    // where workflows are listed so the new one appears.
    // Assuming '/workflows' is the main page listing workflows.
    // Adjust if the path is different or if more specific revalidation is needed.
    revalidatePath('/workflows');
    revalidatePath('/'); // Also revalidate home page if it shows recent workflows or counts
  }

  return result; // Return the created workflow object
}
