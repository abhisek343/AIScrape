import { ExecutionEnvironment } from '@/types/executor';
import { DelayTask } from '@/lib/workflow/task/delay';

export async function DelayExecutor(
  environment: ExecutionEnvironment<typeof DelayTask>
): Promise<boolean> {
  try {
    const msStr = environment.getInput('Delay (ms)');
    const ms = Number(msStr || 1000);
    await new Promise((resolve) => setTimeout(resolve, ms));
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}









