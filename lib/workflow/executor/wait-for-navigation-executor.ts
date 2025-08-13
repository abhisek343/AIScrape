import { ExecutionEnvironment } from '@/types/executor';
import { WaitForNavigationTask } from '@/lib/workflow/task/wait-for-navigation';

export async function WaitForNavigationExecutor(
  environment: ExecutionEnvironment<typeof WaitForNavigationTask>
): Promise<boolean> {
  try {
    const timeoutStr = environment.getInput('Timeout (ms)');
    const timeout = Number(timeoutStr || 30000);
    const page = environment.getPage();
    if (!page) {
      environment.log.error('No page found');
      return false;
    }
    await page.waitForNavigation({ timeout });
    environment.log.info('Navigation completed');
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}





