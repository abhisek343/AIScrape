import { ExecutionEnvironment } from '@/types/executor';
import { failExecutor, requirePage } from '@/lib/workflow/executor/executor-helpers';
import { KeyboardTypeTask } from '@/lib/workflow/task/keyboard-type';

export async function KeyboardTypeExecutor(
  environment: ExecutionEnvironment<typeof KeyboardTypeTask>
): Promise<boolean> {
  try {
    const text = environment.getInput('Text');
    const delayStr = environment.getInput('Delay (ms)');
    const delay = Number(delayStr || 0);
    const page = requirePage(environment);
    if (!page) return false;
    await page.keyboard.type(text || '', { delay });
    return true;
  } catch (error: unknown) {
    return failExecutor(environment, error);
  }
}












