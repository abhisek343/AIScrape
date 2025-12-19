import { MonitorSmartphoneIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const SetViewportTask = {
  type: TaskType.SET_VIEWPORT,
  label: 'Set viewport',
  icon: (props) => <MonitorSmartphoneIcon className="stroke-emerald-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'Width', type: TaskParamType.STRING, required: false },
    { name: 'Height', type: TaskParamType.STRING, required: false },
    { name: 'Device scale factor', type: TaskParamType.STRING, required: false },
  ] as const,
  outputs: [{ name: 'Web page', type: TaskParamType.BROWSER_INSTANCE }] as const,
} satisfies WorkflowTask;





