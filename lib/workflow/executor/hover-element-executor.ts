import { ExecutionEnvironment } from '@/types/executor';
import { failExecutor, requirePage } from '@/lib/workflow/executor/executor-helpers';
import { HoverElementTask } from '@/lib/workflow/task/hover-element';

export async function HoverElementExecutor(
  environment: ExecutionEnvironment<typeof HoverElementTask>
): Promise<boolean> {
  try {
    const selector = environment.getInput('Selector');
    if (!selector) {
      environment.log.error('Selector not provided');
      return false;
    }
    const page = requirePage(environment);
    if (!page) return false;
    await page.hover(selector);
    return true;
  } catch (error: unknown) {
    return failExecutor(environment, error);
  }
}












