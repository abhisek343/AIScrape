import { ScrollToElementTask } from '@/lib/workflow/task/scroll-to-element';
import { getRequiredInput, getRequiredPage, logExecutorError } from '@/lib/workflow/executor/common';
import { ExecutionEnvironment } from '@/types/executor';

export async function ScrollToElementExecutor(
  environment: ExecutionEnvironment<typeof ScrollToElementTask>
): Promise<boolean> {
  try {
    const selector = getRequiredInput(environment, 'Selector', 'input->selector not defined');
    if (!selector) return false;

    const page = getRequiredPage(environment);
    if (!page) return false;

    await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error('Element not found');
      }
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top });
    }, selector);

    return true;
  } catch (error: unknown) {
    logExecutorError(environment, error);
    return false;
  }
}
