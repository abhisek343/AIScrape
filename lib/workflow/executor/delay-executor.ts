import { ExecutionEnvironment } from '@/types/executor';
import { DelayTask } from '@/lib/workflow/task/delay';

// Security: Maximum delay to prevent worker hanging
const MAX_DELAY_MS = 300000; // 5 minutes maximum
const DEFAULT_DELAY_MS = 1000;

export async function DelayExecutor(
  environment: ExecutionEnvironment<typeof DelayTask>
): Promise<boolean> {
  try {
    const msStr = environment.getInput('Delay (ms)');
    const parsedMs = Number(msStr);
    
    // Validate input
    if (isNaN(parsedMs) || parsedMs < 0) {
      environment.log.error('Invalid delay value: must be a non-negative number');
      return false;
    }
    
    // Clamp to maximum
    const ms = Math.min(parsedMs, MAX_DELAY_MS);
    if (parsedMs > MAX_DELAY_MS) {
      environment.log.info(`Delay clamped from ${parsedMs}ms to maximum ${MAX_DELAY_MS}ms`);
    }
    
    // Use nullish coalescing to allow 0ms delays (falsy but valid) while still having a default
    const finalDelay = ms ?? DEFAULT_DELAY_MS;
    await new Promise((resolve) => setTimeout(resolve, finalDelay));
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}
