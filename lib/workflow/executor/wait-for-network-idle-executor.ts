import { ExecutionEnvironment } from '@/types/executor';
import { WaitForNetworkIdleTask } from '@/lib/workflow/task/wait-for-network-idle';

export async function WaitForNetworkIdleExecutor(
  environment: ExecutionEnvironment<typeof WaitForNetworkIdleTask>
): Promise<boolean> {
  try {
    const timeoutStr = environment.getInput('Timeout (ms)');
    const timeout = Number(timeoutStr || 30000);
    const page = environment.getPage();
    if (!page) {
      environment.log.error('No page found');
      return false;
    }
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout });
    environment.log.info('Network is idle');
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}


