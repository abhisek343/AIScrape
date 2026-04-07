import { ExecutionEnvironment } from '@/types/executor';
import { HoverElementTask } from '@/lib/workflow/task/hover-element';
import { getRequiredInput, getRequiredPage, logExecutorError } from '@/lib/workflow/executor/common';

export async function HoverElementExecutor(
  environment: ExecutionEnvironment<typeof HoverElementTask>
): Promise<boolean> {
  try {
    const selector = getRequiredInput(environment, 'Selector', 'Selector not provided');
    if (!selector) return false;

    const page = getRequiredPage(environment);
    if (!page) return false;

    await page.hover(selector);
    return true;
  } catch (error: unknown) {
    logExecutorError(environment, error);
    return false;
  }
}
