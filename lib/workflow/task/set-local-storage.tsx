import { HardDriveIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const SetLocalStorageTask = {
  type: TaskType.SET_LOCAL_STORAGE,
  label: 'Set localStorage',
  icon: (props) => <HardDriveIcon className="stroke-emerald-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'Key', type: TaskParamType.STRING, required: true },
    { name: 'Value', type: TaskParamType.STRING, required: false },
  ] as const,
  outputs: [{ name: 'Web page', type: TaskParamType.BROWSER_INSTANCE }] as const,
} satisfies WorkflowTask;








