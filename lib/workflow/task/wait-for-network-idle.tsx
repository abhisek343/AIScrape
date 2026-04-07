import { RadarIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';
import { webPageInput, webPageOutput } from '@/lib/workflow/task/common';

export const WaitForNetworkIdleTask = {
  type: TaskType.WAIT_FOR_NETWORK_IDLE,
  label: 'Wait for network idle',
  icon: (props) => <RadarIcon className="stroke-amber-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    webPageInput(),
    { name: 'Timeout (ms)', type: TaskParamType.STRING, required: false },
  ] as const,
  outputs: [webPageOutput()] as const,
} satisfies WorkflowTask;
