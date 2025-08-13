import { Code2Icon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const EvaluateJsTask = {
  type: TaskType.EVALUATE_JS,
  label: 'Evaluate JS',
  icon: (props) => <Code2Icon className="stroke-emerald-400" {...props} />,
  isEntryPoint: false,
  credits: 2,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'Code', type: TaskParamType.STRING, variant: 'textarea', required: true },
  ] as const,
  outputs: [{ name: 'Result (stringified)', type: TaskParamType.STRING }] as const,
} satisfies WorkflowTask;





