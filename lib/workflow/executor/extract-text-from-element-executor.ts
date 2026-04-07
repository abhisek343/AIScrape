import * as cheerio from 'cheerio';

import { ExtractTextFromElementTask } from '@/lib/workflow/task/extract-text-from-element';
import { getRequiredInput, logExecutorError } from '@/lib/workflow/executor/common';
import { ExecutionEnvironment } from '@/types/executor';

export async function ExtractTextFromElementExecutor(
  environment: ExecutionEnvironment<typeof ExtractTextFromElementTask>
): Promise<boolean> {
  try {
    const selector = getRequiredInput(environment, 'Selector', 'Selector not defined');
    if (!selector) return false;

    const html = getRequiredInput(environment, 'Html', 'Html not defined');
    if (!html) return false;

    const $ = cheerio.load(html);
    const element = $(selector);

    if (element.length === 0) {
      environment.log.error('Element not found');
      return false;
    }

    const extractedText = element.text();
    if (!extractedText) {
      environment.log.error('Element has no text');
      return false;
    }

    environment.setOutput('Extracted text', extractedText);

    return true;
  } catch (error: unknown) {
    logExecutorError(environment, error);
    return false;
  }
}
