import { PageToHtmlTask } from '@/lib/workflow/task/page-to-html';
import { ExecutionEnvironment } from '@/types/executor';
import { exceedsUtf8Limit } from '@/lib/workflow/output-limits';

export async function PageToHtmlExecutor(environment: ExecutionEnvironment<typeof PageToHtmlTask>): Promise<boolean> {
  try {
    const page = environment.getPage();
    if (!page) {
      environment.log.error('No page found');
      return false;
    }
    const html = await page.content();
    if (exceedsUtf8Limit(html)) {
      environment.log.error('Page HTML exceeds the maximum persisted output size');
      return false;
    }
    environment.setOutput('Html', html);

    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}
