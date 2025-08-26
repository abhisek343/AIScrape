import { Globe2Icon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const HttpRequestTask = {
  type: TaskType.HTTP_REQUEST,
  label: 'HTTP request',
  icon: (props) => <Globe2Icon className="stroke-blue-400" {...props} />,
  isEntryPoint: true,
  credits: 1,
  inputs: [
    { name: 'Method', type: TaskParamType.SELECT, required: true, hideHandle: true, options: [
      { label: 'GET', value: 'GET' },
      { label: 'POST', value: 'POST' },
      { label: 'PUT', value: 'PUT' },
      { label: 'PATCH', value: 'PATCH' },
      { label: 'DELETE', value: 'DELETE' },
    ]},
    { name: 'URL', type: TaskParamType.STRING, required: true },
    { name: 'Headers (JSON)', type: TaskParamType.STRING, variant: 'textarea', required: false },
    { name: 'Body', type: TaskParamType.STRING, variant: 'textarea', required: false },
  ] as const,
  outputs: [
    { name: 'Status', type: TaskParamType.STRING },
    { name: 'Response body', type: TaskParamType.STRING },
  ] as const,
} satisfies WorkflowTask;












