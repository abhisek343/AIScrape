import { RegexIcon as LucideRegexIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const RegexExtractTask = {
  type: TaskType.REGEX_EXTRACT,
  label: 'Regex extract',
  icon: (props) => <LucideRegexIcon className="stroke-rose-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Input', type: TaskParamType.STRING, required: true, variant: 'textarea' },
    { name: 'Pattern', type: TaskParamType.STRING, required: true },
    { name: 'Flags', type: TaskParamType.STRING, required: false },
  ] as const,
  outputs: [{ name: 'Matches (JSON)', type: TaskParamType.STRING }] as const,
} satisfies WorkflowTask;


