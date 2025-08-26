import { KeyboardIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const KeyboardTypeTask = {
  type: TaskType.KEYBOARD_TYPE,
  label: 'Keyboard type',
  icon: (props) => <KeyboardIcon className="stroke-orange-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'Text', type: TaskParamType.STRING, required: true },
    { name: 'Delay (ms)', type: TaskParamType.STRING, required: false },
  ] as const,
  outputs: [{ name: 'Web page', type: TaskParamType.BROWSER_INSTANCE }] as const,
} satisfies WorkflowTask;












