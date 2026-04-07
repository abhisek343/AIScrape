import { EyeIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';
import { webPageInput, webPageOutput } from '@/lib/workflow/task/common';

export const WaitForElementTask = {
  type: TaskType.WAIT_FOR_ELEMENT,
  label: 'Wait for element',
  icon: (props) => <EyeIcon className="stroke-amber-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    webPageInput(),
    {
      name: 'Selector',
      type: TaskParamType.STRING,
      required: true,
    },
    {
      name: 'Visibility',
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { label: 'Visible', value: 'visible' },
        { label: 'Hidden', value: 'hidden' },
      ],
    },
    {
      name: 'Timeout',
      type: TaskParamType.STRING,
      helperText: 'Timeout in milliseconds (default 30000)',
      required: false,
      hideHandle: true,
    }
  ] as const,
  outputs: [webPageOutput()] as const,
} satisfies WorkflowTask;
