import 'server-only';

import prisma from '@/lib/prisma';
import { RetrieveDataTask } from '@/lib/workflow/task/retrieve-data';
import { ExecutionEnvironment } from '@/types/executor';

export async function RetrieveDataExecutor(
  environment: ExecutionEnvironment<typeof RetrieveDataTask>
): Promise<boolean> {
  try {
    const storageKey = environment.getInput('Storage Key');

    if (!storageKey) {
      environment.log.error('No storage key provided');
      return false;
    }

    // Validate storage key format
    if (storageKey.length < 3 || storageKey.length > 100) {
      environment.log.error('Storage key must be between 3 and 100 characters');
      return false;
    }

    // Validate storage key characters
    if (!/^[a-zA-Z0-9_-]+$/.test(storageKey)) {
      environment.log.error('Storage key can only contain letters, numbers, hyphens, and underscores');
      return false;
    }

    const userId = environment.getUserId();
    if (!userId) {
      environment.log.error('Missing user context');
      return false;
    }

    // Retrieve data from database
    const storedData = await prisma.workflowData.findFirst({
      where: {
        userId,
        storageKey,
        expiresAt: {
          gt: new Date(), // Only get non-expired data
        },
      },
    });

    if (!storedData) {
      environment.log.error(`No data found for key: ${storageKey}`);
      return false;
    }

    // Check if data is expired
    if (storedData.expiresAt <= new Date()) {
      environment.log.error(`Data for key ${storageKey} has expired`);
      return false;
    }

    // Log retrieval info
    const dataSize = storedData.data.length;
    const timeUntilExpiry = storedData.expiresAt.getTime() - new Date().getTime();
    const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
    
    environment.log.info(`Data retrieved successfully: Key=${storageKey}, Size=${dataSize} chars, Expires in ${hoursUntilExpiry} hours`);

    // Set outputs
    environment.setOutput('Retrieved Data', storedData.data);
    environment.setOutput('Storage Key', storedData.storageKey);
    environment.setOutput('Description', storedData.description || '');
    environment.setOutput('Expires At', storedData.expiresAt.toISOString());

    return true;
  } catch (error: any) {
    environment.log.error(`Retrieve data failed: ${error.message}`);
    return false;
  }
}
