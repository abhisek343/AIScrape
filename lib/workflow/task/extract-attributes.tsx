import { ListIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const ExtractAttributesTask = {
  type: TaskType.EXTRACT_ATTRIBUTES,
  label: 'Extract attributes',
  icon: (props) => <ListIcon className="stroke-rose-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Html', type: TaskParamType.STRING, required: true, variant: 'textarea' },
    { name: 'Selector', type: TaskParamType.STRING, required: true },
    { name: 'Attribute', type: TaskParamType.STRING, required: true },
  ] as const,
  outputs: [{ name: 'Values (JSON)', type: TaskParamType.STRING }] as const,
} satisfies WorkflowTask;


