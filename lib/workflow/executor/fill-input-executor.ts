import { FillInputTask } from '@/lib/workflow/task/fill-input';
import { ExecutionEnvironment } from '@/types/executor';

export async function FillInputExecutor(environment: ExecutionEnvironment<typeof FillInputTask>): Promise<boolean> {
  try {
    const selector = environment.getInput('Selector');
    if (!selector) {
      environment.log.error('input->selector not defined');
      return false;
    }

    const value = environment.getInput('Value');
    if (value === undefined || value === null) {
      environment.log.error('input->value not defined');
      return false;
    }

    const page = environment.getPage();
    if (!page) {
      environment.log.error('No page found');
      return false;
    }

    await page.type(selector, value);

    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}
