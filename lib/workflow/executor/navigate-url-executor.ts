import { NavigateUrlTask } from '@/lib/workflow/task/navigate-url';
import { ExecutionEnvironment } from '@/types/executor';
import { validateScrapeTarget } from '@/lib/scraping/target-policy';
import { assertRobotsAllowed } from '@/lib/scraping/robots-policy';
import { reserveScrapeSlot } from '@/lib/scraping/rate-limit';
import { redisConnection } from '@/lib/queue/client';

export async function NavigateUrlExecutor(environment: ExecutionEnvironment<typeof NavigateUrlTask>): Promise<boolean> {
  try {
    const url = environment.getInput('URL');
    if (!url) {
      environment.log.error('input->url not defined');
      return false;
    }
    const targetError = validateScrapeTarget(url);
    if (targetError) {
      environment.log.error(`Invalid navigation URL: ${targetError}`);
      return false;
    }

    const page = environment.getPage();
    if (!page) {
      environment.log.error('No page found');
      return false;
    }

    const currentPageUrl = page.url();
    const requested = new URL(url);
    const current = currentPageUrl && currentPageUrl !== 'about:blank' ? new URL(currentPageUrl) : null;
    if (current && current.hostname.toLowerCase() !== requested.hostname.toLowerCase()) {
      environment.log.error('Cross-host browser navigation is disabled by the pinned DNS policy');
      return false;
    }

    const robotsError = await assertRobotsAllowed(requested);
    if (robotsError) {
      environment.log.error(`Navigation rejected: ${robotsError}`);
      return false;
    }
    if (!await reserveScrapeSlot(requested.hostname, redisConnection.set.bind(redisConnection))) {
      environment.log.error('Rate limit reached for target host; retry the workflow later');
      return false;
    }

    await page.goto(url);
    const finalUrl = new URL(page.url());
    if (finalUrl.hostname.toLowerCase() !== requested.hostname.toLowerCase()) {
      environment.log.error('Redirected to a different hostname; navigation rejected');
      return false;
    }
    const finalTargetError = validateScrapeTarget(page.url());
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
