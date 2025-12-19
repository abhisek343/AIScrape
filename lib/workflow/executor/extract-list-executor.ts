import { ExecutionEnvironment } from '@/types/executor';
import { ExtractListTask } from '@/lib/workflow/task/extract-list';
import * as cheerio from 'cheerio';

export async function ExtractListExecutor(
  environment: ExecutionEnvironment<typeof ExtractListTask>
): Promise<boolean> {
  try {
    const html = environment.getInput('Html');
    const selector = environment.getInput('Selector');
    if (!html || !selector) {
      environment.log.error('Missing inputs (Html, Selector)');
      return false;
    }
    const $ = cheerio.load(html);
    const items: string[] = [];
    $(selector).each((_, el) => {
      const text = $(el).text().trim();
      if (text) items.push(text);
    });
    environment.setOutput('Items (JSON)', JSON.stringify(items));
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}












