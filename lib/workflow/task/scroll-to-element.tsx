import { ArrowUpIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';
import { webPageInput, webPageOutput } from '@/lib/workflow/task/common';

export const ScrollToElementTask = {
  type: TaskType.SCROLL_TO_ELEMENT,
  label: 'Scroll to element',
  icon: (props) => <ArrowUpIcon className="stroke-orange-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    webPageInput(),
    {
      name: 'Selector',
      type: TaskParamType.STRING,
      required: true,
    },
  ] as const,
  outputs: [webPageOutput()] as const,
} satisfies WorkflowTask;
