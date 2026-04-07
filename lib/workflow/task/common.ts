import { TaskParamType } from '@/types/task';

export function webPageInput() {
  return { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true } as const;
}

export function webPageOutput() {
  return { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE } as const;
}
