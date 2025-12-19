import { TaskRegistry } from '@/lib/workflow/task/registry';
import { AppNode } from '@/types/appnode';

export function calculateWorkflowCost(nodes: AppNode[]) {
  return nodes.reduce((acc, node) => {
    const task = TaskRegistry[node.data.type];
    if (!task) {
      // Unknown node type; treat as zero cost and continue
      return acc;
    }
    return acc + task.credits;
  }, 0);
}
