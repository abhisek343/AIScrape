import { ExecutionEnvironment } from '@/types/executor';
import { ExtractAttributesTask } from '@/lib/workflow/task/extract-attributes';
import * as cheerio from 'cheerio';

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
    $(selector).each((_, el) => {
      const val = $(el).attr(attribute);
      if (typeof val === 'string') values.push(val);
    });
    environment.setOutput('Values (JSON)', JSON.stringify(values));
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}





