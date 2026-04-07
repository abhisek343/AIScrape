import { HardDriveIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';
import { webPageInput, webPageOutput } from '@/lib/workflow/task/common';

export const SetLocalStorageTask = {
  type: TaskType.SET_LOCAL_STORAGE,
  label: 'Set localStorage',
  icon: (props) => <HardDriveIcon className="stroke-emerald-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    webPageInput(),
    { name: 'Key', type: TaskParamType.STRING, required: true },
    { name: 'Value', type: TaskParamType.STRING, required: false },
  ] as const,
  outputs: [webPageOutput()] as const,
} satisfies WorkflowTask;
