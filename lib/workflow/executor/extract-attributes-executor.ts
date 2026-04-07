import { ExecutionEnvironment } from '@/types/executor';
import { ExtractAttributesTask } from '@/lib/workflow/task/extract-attributes';
import { getRequiredInput, logExecutorError } from '@/lib/workflow/executor/common';
import * as cheerio from 'cheerio';

export async function ExtractAttributesExecutor(
  environment: ExecutionEnvironment<typeof ExtractAttributesTask>
): Promise<boolean> {
  try {
    const html = getRequiredInput(environment, 'Html', 'Missing inputs (Html, Selector, Attribute)');
    const selector = getRequiredInput(environment, 'Selector', 'Missing inputs (Html, Selector, Attribute)');
    const attribute = getRequiredInput(environment, 'Attribute', 'Missing inputs (Html, Selector, Attribute)');
    if (!html || !selector || !attribute) return false;

    const $ = cheerio.load(html);
    const values: string[] = [];
    $(selector).each((_, el) => {
      const val = $(el).attr(attribute);
      if (typeof val === 'string') values.push(val);
    });
    environment.setOutput('Values (JSON)', JSON.stringify(values));
    return true;
  } catch (error: unknown) {
    logExecutorError(environment, error);
    return false;
  }
}
