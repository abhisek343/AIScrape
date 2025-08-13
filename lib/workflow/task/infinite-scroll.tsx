import { ScrollText } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const InfiniteScrollTask = {
  type: TaskType.INFINITE_SCROLL,
  label: 'Infinite scroll',
  icon: (props) => <ScrollText className="stroke-amber-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'Iterations', type: TaskParamType.STRING, required: false },
    { name: 'Delay (ms)', type: TaskParamType.STRING, required: false },
  ] as const,
  outputs: [{ name: 'Web page', type: TaskParamType.BROWSER_INSTANCE }] as const,
} satisfies WorkflowTask;


