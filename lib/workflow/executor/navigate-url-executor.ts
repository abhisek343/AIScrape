import { NavigateUrlTask } from '@/lib/workflow/task/navigate-url';
import { ExecutionEnvironment } from '@/types/executor';

export async function NavigateUrlExecutor(environment: ExecutionEnvironment<typeof NavigateUrlTask>): Promise<boolean> {
  try {
    const url = environment.getInput('URL');
    if (!url) {
      environment.log.error('input->url not defined');
      return false;
    }

    const page = environment.getPage();
    if (!page) {
      environment.log.error('No page found');
      return false;
    }

    await page.goto(url);
    environment.log.info(`Visited ${url}`);

    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}
