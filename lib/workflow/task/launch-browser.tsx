import { GlobeIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';
import { webPageOutput } from '@/lib/workflow/task/common';

export const LaunchBrowserTask = {
  type: TaskType.LAUNCH_BROWSER,
  label: 'Launch Browser',
  icon: (props) => <GlobeIcon className="stroke-pink-400" {...props} />,
  isEntryPoint: true,
  credits: 5,
  inputs: [
    {
      name: 'Website Url',
      type: TaskParamType.STRING,
      helperText: 'eg: https://www.google.com',
      required: true,
      hideHandle: true,
    },
    {
      name: 'Timeout',
      type: TaskParamType.STRING,
      helperText: 'Timeout in milliseconds (default 30000)',
      required: false,
      hideHandle: true,
    }
  ] as const,
  outputs: [
    webPageOutput(),
  ] as const,
} satisfies WorkflowTask;
