import { Code2Icon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';
import { webPageInput } from '@/lib/workflow/task/common';

export const EvaluateJsTask = {
  type: TaskType.EVALUATE_JS,
  label: 'Evaluate JS',
  icon: (props) => <Code2Icon className="stroke-emerald-400" {...props} />,
  isEntryPoint: false,
  credits: 2,
  inputs: [
    webPageInput(),
    { name: 'Code', type: TaskParamType.STRING, variant: 'textarea', required: true },
  ] as const,
  outputs: [{ name: 'Result (stringified)', type: TaskParamType.STRING }] as const,
} satisfies WorkflowTask;
