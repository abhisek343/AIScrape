import { RadarIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const WaitForNetworkIdleTask = {
  type: TaskType.WAIT_FOR_NETWORK_IDLE,
  label: 'Wait for network idle',
  icon: (props) => <RadarIcon className="stroke-amber-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'Timeout (ms)', type: TaskParamType.STRING, required: false },
  ] as const,
  outputs: [{ name: 'Web page', type: TaskParamType.BROWSER_INSTANCE }] as const,
} satisfies WorkflowTask;












