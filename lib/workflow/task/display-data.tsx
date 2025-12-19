import { EyeIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const DisplayDataTask = {
  type: TaskType.DISPLAY_DATA,
  label: 'Display Data',
  icon: (props) => <EyeIcon className="stroke-green-400" {...props} />,
  isEntryPoint: false,
  credits: 0, // Free task for displaying data
  inputs: [
    {
      name: 'Data to Display',
      type: TaskParamType.STRING,
      required: true,
      helperText: 'The data you want to display (can be connected from previous nodes)',
    },
    {
      name: 'Display Title',
      type: TaskParamType.STRING,
      required: false,
      helperText: 'Optional title for the displayed data',
    },
    {
      name: 'Format as JSON',
      type: TaskParamType.SELECT,
      required: false,
      options: [
        { label: 'Auto-detect', value: 'auto' },
        { label: 'Always format as JSON', value: 'json' },
        { label: 'Display as text', value: 'text' },
      ],
      defaultValue: 'auto',
      helperText: 'How to format the displayed data',
    },
  ] as const,
  outputs: [
    {
      name: 'Displayed Data',
      type: TaskParamType.STRING,
      helperText: 'The formatted data that was displayed',
    },
  ] as const,
} satisfies WorkflowTask;
