import { ExecutionEnvironment } from '@/types/executor';
import { SetViewportTask } from '@/lib/workflow/task/set-viewport';

export async function SetViewportExecutor(
  environment: ExecutionEnvironment<typeof SetViewportTask>
): Promise<boolean> {
  try {
    const widthStr = environment.getInput('Width');
    const heightStr = environment.getInput('Height');
    const deviceScaleFactorStr = environment.getInput('Device scale factor');

    const width = Number(widthStr || 1280);
    const height = Number(heightStr || 720);
    const deviceScaleFactor = Number(deviceScaleFactorStr || 1);

    const page = environment.getPage();
    if (!page) {
      environment.log.error('No page found');
      return false;
    }

    await page.setViewport({ width, height, deviceScaleFactor });
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}





