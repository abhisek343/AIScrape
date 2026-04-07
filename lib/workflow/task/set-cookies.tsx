import { CookieIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';
import { webPageInput, webPageOutput } from '@/lib/workflow/task/common';

export const SetCookiesTask = {
  type: TaskType.SET_COOKIES,
  label: 'Set cookies',
  icon: (props) => <CookieIcon className="stroke-emerald-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    webPageInput(),
    { name: 'Cookies (JSON)', type: TaskParamType.STRING, variant: 'textarea', required: true },
  ] as const,
  outputs: [webPageOutput()] as const,
} satisfies WorkflowTask;
