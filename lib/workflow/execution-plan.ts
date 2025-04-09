import { Edge } from '@xyflow/react';

import { TaskRegistry } from '@/lib/workflow/task/registry';
import { AppNode, AppNodeMissingInputs } from '@/types/appnode';
import { WorkflowExecutionPlan, WorkflowExecutionPlanPhase, WorkflowTask } from '@/types/workflow'; // Added WorkflowTask

export enum FlowToExecutionPlanValidationError {
  'NO_ENTRY_POINT',
  'INVALID_INPUTS',
}

type FlowToExecutionPlanType = {
  executionPlan?: WorkflowExecutionPlan;
  error?: {
    type: FlowToExecutionPlanValidationError;
    invalidElements?: AppNodeMissingInputs[];
  };
};

export function flowToExecutionPlan(nodes: AppNode[], edges: Edge[]): FlowToExecutionPlanType {
  const entryPoint = nodes.find((node) => {
    const taskDefinition = TaskRegistry[node.data.type];
    if (!taskDefinition) {
      console.warn(`Node type "${node.data.type}" (ID: ${node.id}) not found in TaskRegistry. Skipping for entry point check.`);
      return false;
    }
    return taskDefinition.isEntryPoint;
  });

  if (!entryPoint) {
    // It's possible no valid entry point was found if all node types were invalid
    // or if no registered node is an entry point.
    const hasValidNodes = nodes.some(node => TaskRegistry[node.data.type]);
    if (!hasValidNodes && nodes.length > 0) {
      console.error("FlowToExecutionPlan: No valid node types found in the workflow definition. All node types are unregistered.");
      // Consider a more specific error type if desired
    }
    return {
      error: {
        type: FlowToExecutionPlanValidationError.NO_ENTRY_POINT,
      },
    };
  }

  const inputsWithErrors: AppNodeMissingInputs[] = [];
  const planned = new Set<string>();

  // Check inputs for the identified entry point
  const entryPointTaskDefinition = TaskRegistry[entryPoint.data.type];
  if (!entryPointTaskDefinition) {
    // This should ideally not happen if entryPoint was found, but as a safeguard:
    console.error(`Task definition for entry point node type "${entryPoint.data.type}" (ID: ${entryPoint.id}) not found in TaskRegistry.`);
    return { error: { type: FlowToExecutionPlanValidationError.NO_ENTRY_POINT } }; // Or a new error type
  }

  const invalidEntryPointInputs = getInvalidInputs(entryPoint, entryPointTaskDefinition.inputs, edges, planned);
  if (invalidEntryPointInputs.length > 0) {
    inputsWithErrors.push({ nodeId: entryPoint.id, inputs: invalidEntryPointInputs });
  }

  const executionPlan: WorkflowExecutionPlan = [
    {
      phase: 1,
      nodes: [entryPoint],
    },
  ];

  planned.add(entryPoint.id);

  for (let phase = 2; phase <= nodes.length && planned.size < nodes.length; phase++) {
    const nextPhase: WorkflowExecutionPlanPhase = { phase, nodes: [] };

    for (const currentNode of nodes) {
      if (planned.has(currentNode.id)) {
        // Node already put in the execution plan
        continue;
      }

      const taskDefinition = TaskRegistry[currentNode.data.type];
      if (!taskDefinition) {
        console.warn(`Node type "${currentNode.data.type}" (ID: ${currentNode.id}) not found in TaskRegistry. Skipping this node in phase planning.`);
        // Potentially add to an error list or handle as a critical error if strict validation is needed
        inputsWithErrors.push({ nodeId: currentNode.id, inputs: [`INVALID_NODE_TYPE: ${currentNode.data.type}`] });
        continue; // Skip this unregistered node
      }

      const invalidNodeInputs = getInvalidInputs(currentNode, taskDefinition.inputs, edges, planned);
      if (invalidNodeInputs.length > 0) {
        const incomers = getIncomers(currentNode, nodes, edges);
        if (incomers.every((incomer) => planned.has(incomer.id))) {
          // If all the incomers/edges are planned and there are still invalid inputs
          // this means that this particular node has an invalid input
          // which means that the workflow is invalid
          console.error('Invalid inputs', currentNode.id, invalidNodeInputs); // Corrected variable name

          inputsWithErrors.push({ nodeId: currentNode.id, inputs: invalidNodeInputs }); // Corrected variable name
        } else {
          // Let's skip this node for now
          continue;
        }
      }

      nextPhase.nodes.push(currentNode);
    }
    for (const node of nextPhase.nodes) {
      planned.add(node.id);
    }
    executionPlan.push(nextPhase);
  }

  if (inputsWithErrors.length > 0) {
    return {
      error: {
        type: FlowToExecutionPlanValidationError.INVALID_INPUTS,
        invalidElements: inputsWithErrors,
      },
    };
  }

  return { executionPlan };
}

function getInvalidInputs(node: AppNode, taskInputs: WorkflowTask['inputs'], edges: Edge[], planned: Set<string>) {
  const invalidInputsList = [];
  // taskInputs are the defined inputs for the node type from TaskRegistry

  for (const inputDef of taskInputs) {
    const inputValue = node.data.inputs[inputDef.name];
    const inputValueProvided = inputValue !== undefined && inputValue !== null && inputValue !== ''; // More robust check

    if (inputValueProvided) {
      // Value is directly provided in node.data.inputs
      continue;
    }

    // If a value is not provided directly, check if it's linked from an edge
    const incomingEdgeForInput = edges.find(
      (edge) => edge.target === node.id && edge.targetHandle === inputDef.name
    );

    if (incomingEdgeForInput) {
      // Input is expected from an edge
      if (planned.has(incomingEdgeForInput.source)) {
        // Source node is already planned, so this input is considered provided by a planned task
        continue;
      } else if (inputDef.required) {
        // Source node is not yet planned, but this input is required
        invalidInputsList.push(inputDef.name);
      }
      // If not required and source not planned, it's okay for now, might be planned in a later phase
    } else if (inputDef.required) {
      // No direct value, no incoming edge, and it's required
      invalidInputsList.push(inputDef.name);
    }
  }

  return invalidInputsList;
}

function getIncomers(node: AppNode, nodes: AppNode[], edges: Edge[]) {
  if (!node.id) {
    return [];
  }

  const incomersIds = new Set();
  edges.forEach((edge) => {
    if (edge.target === node.id) {
      incomersIds.add(edge.source);
    }
  });

  return nodes.filter((n) => incomersIds.has(n.id));
}
