import { ExecutionEnvironment } from '@/types/executor';
import { ExtractAttributesTask } from '@/lib/workflow/task/extract-attributes';
import * as cheerio from 'cheerio';
import { MAX_COLLECTION_ITEMS, exceedsUtf8Limit } from '@/lib/workflow/output-limits';

export async function ExtractAttributesExecutor(
  environment: ExecutionEnvironment<typeof ExtractAttributesTask>
): Promise<boolean> {
  try {
    const html = environment.getInput('Html');
    const selector = environment.getInput('Selector');
    const attribute = environment.getInput('Attribute');
    if (!html || !selector || !attribute) {
      environment.log.error('Missing inputs (Html, Selector, Attribute)');
      return false;
    }
    const $ = cheerio.load(html);
    const values: string[] = [];
    let overflow = false;
    $(selector).each((_, el) => {
      if (values.length >= MAX_COLLECTION_ITEMS) {
        overflow = true;
        return false;
      }
      const val = $(el).attr(attribute);
      if (typeof val === 'string') values.push(val);
    });
    if (overflow) {
      environment.log.error('Extracted attributes exceed the maximum item count');
      return false;
    }
    const output = JSON.stringify(values);
    if (exceedsUtf8Limit(output)) {
      environment.log.error('Extracted attributes exceed the maximum persisted output size');
      return false;
    }
    environment.setOutput('Values (JSON)', output);
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}





