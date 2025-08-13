import { DatabaseIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const StoreDataTask = {
  type: TaskType.STORE_DATA,
  label: 'Store Data',
  icon: (props) => <DatabaseIcon className="stroke-blue-400" {...props} />,
  isEntryPoint: false,
  credits: 0, // Free task for storing data
  inputs: [
    {
      name: 'Data to Store',
      type: TaskParamType.STRING,
      required: true,
      helperText: 'The data you want to store (can be connected from previous nodes)',
    },
    {
      name: 'Storage Key',
      type: TaskParamType.STRING,
      required: true,
      helperText: 'Unique key to identify this data for later retrieval',
    },
    {
      name: 'Description',
      type: TaskParamType.STRING,
      required: false,
      helperText: 'Optional description of what this data contains',
    },
    {
      name: 'Expiration (hours)',
      type: TaskParamType.STRING,
      required: false,
      helperText: 'How long to keep this data (default: 24 hours, max: 168 hours)',
    },
  ] as const,
  outputs: [
    {
      name: 'Storage Key',
      helperText: 'The key used to store the data',
    },
    {
      name: 'Stored Data',
      helperText: 'The data that was stored',
    },
  ] as const,
} satisfies WorkflowTask;
