import { NavigationIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';
import { webPageInput, webPageOutput } from '@/lib/workflow/task/common';

export const WaitForNavigationTask = {
  type: TaskType.WAIT_FOR_NAVIGATION,
  label: 'Wait for navigation',
  icon: (props) => <NavigationIcon className="stroke-amber-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    webPageInput(),
    { name: 'Timeout (ms)', type: TaskParamType.STRING, required: false },
  ] as const,
  outputs: [webPageOutput()] as const,
} satisfies WorkflowTask;
