import { CodeIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';
import { webPageInput, webPageOutput } from '@/lib/workflow/task/common';

export const PageToHtmlTask = {
  type: TaskType.PAGE_TO_HTML,
  label: 'Get html from page',
  icon: (props) => <CodeIcon className="stroke-rose-400" {...props} />,
  isEntryPoint: false,
  credits: 2,
  inputs: [webPageInput()] as const,
  outputs: [
    {
      name: 'Html',
      type: TaskParamType.STRING,
    },
    webPageOutput(),
  ] as const,
} satisfies WorkflowTask;
