import { ExecutionEnvironment } from '@/types/executor';
import { KeyboardTypeTask } from '@/lib/workflow/task/keyboard-type';

export async function KeyboardTypeExecutor(
  environment: ExecutionEnvironment<typeof KeyboardTypeTask>
): Promise<boolean> {
  try {
    const text = environment.getInput('Text');
    const delayStr = environment.getInput('Delay (ms)');
    const delay = Number(delayStr || 0);
    const page = environment.getPage();
    if (!page) {
      environment.log.error('No page found');
      return false;
    }
    await page.keyboard.type(text || '', { delay });
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}









