import { ExecutionEnvironment } from '@/types/executor';
import { InfiniteScrollTask } from '@/lib/workflow/task/infinite-scroll';

// Security: Maximum iterations and delay to prevent resource exhaustion
const MAX_ITERATIONS = 100;
const MAX_DELAY_MS = 10000;
const DEFAULT_ITERATIONS = 5;
const DEFAULT_DELAY_MS = 1000;

export async function InfiniteScrollExecutor(
  environment: ExecutionEnvironment<typeof InfiniteScrollTask>
): Promise<boolean> {
  try {
    const iterationsStr = environment.getInput('Iterations');
    const delayMsStr = environment.getInput('Delay (ms)');
    
    // Parse and validate inputs
    const parsedIterations = Number(iterationsStr);
    const parsedDelayMs = Number(delayMsStr);
    
    const iterations = Math.min(
      Math.max(isNaN(parsedIterations) ? DEFAULT_ITERATIONS : parsedIterations, 1),
      MAX_ITERATIONS
    );
    const delayMs = Math.min(
      Math.max(isNaN(parsedDelayMs) ? DEFAULT_DELAY_MS : parsedDelayMs, 0),
      MAX_DELAY_MS
    );
    
    // Log if values were clamped
    if (!isNaN(parsedIterations) && parsedIterations > MAX_ITERATIONS) {
      environment.log.info(`Iterations clamped from ${parsedIterations} to maximum ${MAX_ITERATIONS}`);
    }
    if (!isNaN(parsedDelayMs) && parsedDelayMs > MAX_DELAY_MS) {
      environment.log.info(`Delay clamped from ${parsedDelayMs}ms to maximum ${MAX_DELAY_MS}ms`);
    }
    
    const page = environment.getPage();
    if (!page) {
      environment.log.error('No page found');
      return false;
    }
    
    for (let i = 0; i < iterations; i++) {
      await page.evaluate(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      });
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    
    environment.log.info(`Infinite scroll completed: ${iterations} iterations with ${delayMs}ms delay`);
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}


