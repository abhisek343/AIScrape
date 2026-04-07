import { KeyboardIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';
import { webPageInput, webPageOutput } from '@/lib/workflow/task/common';

export const KeyboardTypeTask = {
  type: TaskType.KEYBOARD_TYPE,
  label: 'Keyboard type',
  icon: (props) => <KeyboardIcon className="stroke-orange-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    webPageInput(),
    { name: 'Text', type: TaskParamType.STRING, required: true },
    { name: 'Delay (ms)', type: TaskParamType.STRING, required: false },
  ] as const,
  outputs: [webPageOutput()] as const,
} satisfies WorkflowTask;
