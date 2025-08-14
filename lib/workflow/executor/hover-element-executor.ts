import { ExecutionEnvironment } from '@/types/executor';
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
    const page = environment.getPage();
    if (!page) {
      environment.log.error('No page found');
      return false;
    }
    await page.hover(selector);
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}









