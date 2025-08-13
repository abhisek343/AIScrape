import { ExecutionEnvironment } from '@/types/executor';
import { InfiniteScrollTask } from '@/lib/workflow/task/infinite-scroll';

export async function InfiniteScrollExecutor(
  environment: ExecutionEnvironment<typeof InfiniteScrollTask>
): Promise<boolean> {
  try {
    const iterationsStr = environment.getInput('Iterations');
    const delayMsStr = environment.getInput('Delay (ms)');
    const iterations = Number(iterationsStr || 5);
    const delayMs = Number(delayMsStr || 1000);
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
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}


