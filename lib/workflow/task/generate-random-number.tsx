import { Hash } from 'lucide-react';
import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const GenerateRandomNumberTask = {
    type: TaskType.GENERATE_RANDOM_NUMBER,
    label: 'Generate Random Number',
    icon: (props) => <Hash className="stroke-orange-400" {...props} />,
    isEntryPoint: false,
    credits: 1,
    inputs: [
        {
            name: 'Min',
            type: TaskParamType.STRING,
            required: true,
            defaultValue: '0',
        },
        {
            name: 'Max',
            type: TaskParamType.STRING,
            required: true,
            defaultValue: '100',
        },
    ] as const,
    outputs: [
        {
            name: 'Random Number',
            type: TaskParamType.STRING,
        },
    ] as const,
} satisfies WorkflowTask;
