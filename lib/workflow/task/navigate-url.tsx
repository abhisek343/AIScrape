import { Link2Icon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';
import { webPageInput, webPageOutput } from '@/lib/workflow/task/common';

export const NavigateUrlTask = {
  type: TaskType.NAVIGATE_URL,
  label: 'Navigate Url',
  icon: (props) => <Link2Icon className="stroke-orange-400" {...props} />,
  isEntryPoint: false,
  credits: 2,
  inputs: [
    webPageInput(),
    {
      name: 'URL',
      type: TaskParamType.STRING,
      required: true,
    },
  ] as const,
  outputs: [webPageOutput()] as const,
} satisfies WorkflowTask;
