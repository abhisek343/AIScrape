import { NavigateUrlTask } from '@/lib/workflow/task/navigate-url';
import { ExecutionEnvironment } from '@/types/executor';
import { assertPublicScrapeTarget } from '@/lib/scraping/target-policy';

export async function NavigateUrlExecutor(environment: ExecutionEnvironment<typeof NavigateUrlTask>): Promise<boolean> {
  try {
    const url = environment.getInput('URL');
    if (!url) {
      environment.log.error('input->url not defined');
      return false;
    }
    const targetError = await assertPublicScrapeTarget(url);
    if (targetError) {
      environment.log.error(`Invalid navigation URL: ${targetError}`);
      return false;
    }

    const page = environment.getPage();
    if (!page) {
      environment.log.error('No page found');
      return false;
    }

    await page.goto(url);
    const finalTargetError = await assertPublicScrapeTarget(page.url());
    if (finalTargetError) {
      environment.log.error(`Redirected to an unsafe URL: ${finalTargetError}`);
      return false;
    }
    environment.log.info(`Visited ${url}`);

    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}
