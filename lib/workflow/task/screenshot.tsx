import { ImageIcon } from 'lucide-react';

import { TaskParamType, TaskType } from '@/types/task';
import { WorkflowTask } from '@/types/workflow';

export const ScreenshotTask = {
  type: TaskType.SCREENSHOT,
  label: 'Screenshot',
  icon: (props) => <ImageIcon className="stroke-emerald-400" {...props} />,
  isEntryPoint: false,
  credits: 2,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'Selector', type: TaskParamType.STRING, required: false },
    {
      name: 'Mode',
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { label: 'Full page', value: 'fullpage' },
        { label: 'Element', value: 'element' },
      ],
    },
    {
      name: 'Format',
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { label: 'PNG', value: 'png' },
        { label: 'JPEG', value: 'jpeg' },
      ],
    },
    { name: 'Quality', type: TaskParamType.STRING, required: false, helperText: '1-100 (JPEG only)' },
  ] as const,
  outputs: [{ name: 'Image (base64)', type: TaskParamType.STRING }] as const,
} satisfies WorkflowTask;


