import { ScrollToElementTask } from '@/lib/workflow/task/scroll-to-element';
import { ExecutionEnvironment } from '@/types/executor';
import { failExecutor, requirePage } from '@/lib/workflow/executor/executor-helpers';

export async function ScrollToElementExecutor(
  environment: ExecutionEnvironment<typeof ScrollToElementTask>
): Promise<boolean> {
  try {
    const selector = environment.getInput('Selector');
    if (!selector) {
      environment.log.error('input->selector not defined');
      return false;
    }

    const page = requirePage(environment);
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
    return failExecutor(environment, error);
  }
}
