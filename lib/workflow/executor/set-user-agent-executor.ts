import { ExecutionEnvironment } from '@/types/executor';
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
    const page = environment.getPage();
    if (!page) {
      environment.log.error('No page found');
      return false;
    }
    await page.setUserAgent(userAgent);
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}





