import { ExecutionEnvironment } from '@/types/executor';
import { ScreenshotTask } from '@/lib/workflow/task/screenshot';

export async function ScreenshotExecutor(
  environment: ExecutionEnvironment<typeof ScreenshotTask>
): Promise<boolean> {
  try {
    const selector = environment.getInput('Selector');
    const imageFormat = environment.getInput('Format') || 'png';
    const qualityStr = environment.getInput('Quality');
    const fullPageMode = environment.getInput('Mode') === 'fullpage';

    const page = environment.getPage();
    if (!page) {
      environment.log.error('No page found');
      return false;
    }

    let buffer: Buffer;
    if (fullPageMode || !selector) {
      buffer = (await page.screenshot({
        type: imageFormat === 'jpeg' ? 'jpeg' : 'png',
        quality: imageFormat === 'jpeg' && qualityStr ? Number(qualityStr) : undefined,
        fullPage: true,
        encoding: 'binary',
      })) as Buffer;
    } else {
      const element = await page.$(selector);
      if (!element) {
        environment.log.error(`Element not found: ${selector}`);
        return false;
      }
      buffer = (await element.screenshot({
        type: imageFormat === 'jpeg' ? 'jpeg' : 'png',
        quality: imageFormat === 'jpeg' && qualityStr ? Number(qualityStr) : undefined,
        encoding: 'binary',
      })) as Buffer;
    }

    const base64 = buffer.toString('base64');
    environment.setOutput('Image (base64)', base64);
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}





