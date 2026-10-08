import { ExecutionEnvironment } from '@/types/executor';
import { failExecutor, requirePage } from '@/lib/workflow/executor/executor-helpers';
import { WaitForNavigationTask } from '@/lib/workflow/task/wait-for-navigation';

export async function WaitForNavigationExecutor(
  environment: ExecutionEnvironment<typeof WaitForNavigationTask>
): Promise<boolean> {
  try {
    const timeoutStr = environment.getInput('Timeout (ms)');
    const timeout = Number(timeoutStr || 30000);
    const page = requirePage(environment);
    if (!page) return false;
    await page.waitForNavigation({ timeout });
    environment.log.info('Navigation completed');
    return true;
  } catch (error: unknown) {
    return failExecutor(environment, error);
  }
}





