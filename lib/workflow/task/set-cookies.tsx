import { CookieIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const SetCookiesTask = {
  type: TaskType.SET_COOKIES,
  label: 'Set cookies',
  icon: (props) => <CookieIcon className="stroke-emerald-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'Cookies (JSON)', type: TaskParamType.STRING, variant: 'textarea', required: true },
  ] as const,
  outputs: [{ name: 'Web page', type: TaskParamType.BROWSER_INSTANCE }] as const,
} satisfies WorkflowTask;





