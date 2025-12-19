import { DownloadIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const RetrieveDataTask = {
  type: TaskType.RETRIEVE_DATA,
  label: 'Retrieve Data',
  icon: (props) => <DownloadIcon className="stroke-purple-400" {...props} />,
  isEntryPoint: false,
  credits: 0, // Free task for retrieving data
  inputs: [
    {
      name: 'Storage Key',
      type: TaskParamType.STRING,
      required: true,
      helperText: 'The key of the data you want to retrieve',
    },
  ] as const,
  outputs: [
    {
      name: 'Retrieved Data',
      type: TaskParamType.STRING,
      helperText: 'The data that was retrieved from storage',
    },
    {
      name: 'Storage Key',
      type: TaskParamType.STRING,
      helperText: 'The key that was used to retrieve the data',
    },
    {
      name: 'Description',
      type: TaskParamType.STRING,
      helperText: 'The description of the stored data',
    },
    {
      name: 'Expires At',
      type: TaskParamType.STRING,
      helperText: 'When the data expires',
    },
  ] as const,
} satisfies WorkflowTask;
