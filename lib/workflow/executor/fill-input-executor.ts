import { FillInputTask } from '@/lib/workflow/task/fill-input';
import { getRequiredInput, getRequiredPage, logExecutorError } from '@/lib/workflow/executor/common';
import { ExecutionEnvironment } from '@/types/executor';

export async function FillInputExecutor(environment: ExecutionEnvironment<typeof FillInputTask>): Promise<boolean> {
  try {
    const selector = getRequiredInput(environment, 'Selector', 'input->selector not defined');
    if (!selector) return false;

    const value = getRequiredInput(environment, 'Value', 'input->value not defined');
    if (value === null) return false;

    const page = getRequiredPage(environment);
    if (!page) return false;

    await page.type(selector, value);

    return true;
  } catch (error: unknown) {
    logExecutorError(environment, error);
    return false;
  }
}
