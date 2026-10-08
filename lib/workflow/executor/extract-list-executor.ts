import { ExecutionEnvironment } from '@/types/executor';
import { ExtractListTask } from '@/lib/workflow/task/extract-list';
import * as cheerio from 'cheerio';
import { MAX_COLLECTION_ITEMS, exceedsUtf8Limit } from '@/lib/workflow/output-limits';

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
    let overflow = false;
    $(selector).each((_, el) => {
      if (items.length >= MAX_COLLECTION_ITEMS) {
        overflow = true;
        return false;
      }
      const text = $(el).text().trim();
      if (text) items.push(text);
    });
    if (overflow) {
      environment.log.error('Extracted list exceeds the maximum item count');
      return false;
    }
    const output = JSON.stringify(items);
    if (exceedsUtf8Limit(output)) {
      environment.log.error('Extracted list exceeds the maximum persisted output size');
      return false;
    }
    environment.setOutput('Items (JSON)', output);
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}












