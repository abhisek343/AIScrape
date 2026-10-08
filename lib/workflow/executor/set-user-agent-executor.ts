import { ExecutionEnvironment } from '@/types/executor';
import { failExecutor, requirePage } from '@/lib/workflow/executor/executor-helpers';
import { SetUserAgentTask } from '@/lib/workflow/task/set-user-agent';

export async function SetUserAgentExecutor(
  environment: ExecutionEnvironment<typeof SetUserAgentTask>
): Promise<boolean> {
  try {
    const userAgent = environment.getInput('User agent');
    if (!userAgent) {
      environment.log.error('User agent not provided');
      return false;
    }
    const page = requirePage(environment);
    if (!page) return false;
    await page.setUserAgent(userAgent);
    return true;
  } catch (error: unknown) {
    return failExecutor(environment, error);
  }
}





