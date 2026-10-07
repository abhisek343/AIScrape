import { ExecutionEnvironment } from '@/types/executor';
import { WaitForNetworkIdleTask } from '@/lib/workflow/task/wait-for-network-idle';

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 300_000;

export async function WaitForNetworkIdleExecutor(
  environment: ExecutionEnvironment<typeof WaitForNetworkIdleTask>
): Promise<boolean> {
  try {
    const timeoutStr = environment.getInput('Timeout (ms)');
    const parsed = timeoutStr ? Number(timeoutStr) : DEFAULT_TIMEOUT_MS;
    if (!Number.isFinite(parsed) || parsed < 1_000 || parsed > MAX_TIMEOUT_MS) {
      environment.log.error(`Timeout must be between 1000 and ${MAX_TIMEOUT_MS}ms`);
      return false;
    }

    const page = environment.getPage();
    if (!page) {
      environment.log.error('No page found');
      return false;
    }

    await page.waitForNetworkIdle({
      idleTime: 500,
      timeout: parsed,
    });
    environment.log.info('Network is idle');
    return true;
  } catch (error: unknown) {
    environment.log.error(error instanceof Error ? error.message : String(error));
    return false;
  }
}
