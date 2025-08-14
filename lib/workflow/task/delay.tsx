import { TimerIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const DelayTask = {
  type: TaskType.DELAY,
  label: 'Delay',
  icon: (props) => <TimerIcon className="stroke-amber-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Delay (ms)', type: TaskParamType.STRING, required: true, hideHandle: true },
  ] as const,
  outputs: [] as const,
} satisfies WorkflowTask;









