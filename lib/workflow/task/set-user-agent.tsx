import { BadgeCheckIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';
import { webPageInput, webPageOutput } from '@/lib/workflow/task/common';

export const SetUserAgentTask = {
  type: TaskType.SET_USER_AGENT,
  label: 'Set user agent',
  icon: (props) => <BadgeCheckIcon className="stroke-emerald-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    webPageInput(),
    { name: 'User agent', type: TaskParamType.STRING, required: true },
  ] as const,
  outputs: [webPageOutput()] as const,
} satisfies WorkflowTask;
