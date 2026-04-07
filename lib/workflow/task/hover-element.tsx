import { MousePointerIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';
import { webPageInput, webPageOutput } from '@/lib/workflow/task/common';

export const HoverElementTask = {
  type: TaskType.HOVER_ELEMENT,
  label: 'Hover element',
  icon: (props) => <MousePointerIcon className="stroke-orange-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    webPageInput(),
    { name: 'Selector', type: TaskParamType.STRING, required: true },
  ] as const,
  outputs: [webPageOutput()] as const,
} satisfies WorkflowTask;
