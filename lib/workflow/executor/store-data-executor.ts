import 'server-only';

import prisma from '@/lib/prisma';
import { StoreDataTask } from '@/lib/workflow/task/store-data';
import { ExecutionEnvironment } from '@/types/executor';
import { safeJsonStringify } from '@/lib/safe-json';

export async function StoreDataExecutor(
  environment: ExecutionEnvironment<typeof StoreDataTask>
): Promise<boolean> {
  try {
    const dataToStore = environment.getInput('Data to Store');
    const storageKey = environment.getInput('Storage Key');
    const description = environment.getInput('Description') || '';
    const expirationHours = environment.getInput('Expiration (hours)') || '24';

    if (!dataToStore) {
      environment.log.error('No data provided to store');
      return false;
    }

    if (!storageKey) {
      environment.log.error('No storage key provided');
      return false;
    }

    // Validate storage key format
    if (storageKey.length < 3 || storageKey.length > 100) {
      environment.log.error('Storage key must be between 3 and 100 characters');
      return false;
    }

    // Validate storage key characters (alphanumeric, hyphens, underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(storageKey)) {
      environment.log.error('Storage key can only contain letters, numbers, hyphens, and underscores');
      return false;
    }

    // Validate data size
    if (dataToStore.length > 10 * 1024 * 1024) { // 10MB limit
      environment.log.error('Data to store exceeds maximum size of 10MB');
      return false;
    }

    // Validate expiration hours
    const expirationHoursNum = parseInt(expirationHours);
    if (isNaN(expirationHoursNum) || expirationHoursNum < 1 || expirationHoursNum > 168) {
      environment.log.error('Expiration must be between 1 and 168 hours');
      return false;
    }

    const userId = environment.getUserId();
    if (!userId) {
      environment.log.error('Missing user context');
      return false;
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHoursNum);

    // Create unique key for this user
    const userStorageKey = `${userId}:${storageKey}`;

    // Check if data already exists
    const existingData = await prisma.workflowData.findFirst({
      where: {
        userId,
        storageKey,
      },
    });

    if (existingData) {
      environment.log.info(`Updating existing data for key: ${storageKey}`);
      
      // Update existing data
      await prisma.workflowData.update({
        where: { id: existingData.id },
        data: {
          data: dataToStore,
          description,
          expiresAt,
          updatedAt: new Date(),
        },
      });
    } else {
      environment.log.info(`Storing new data with key: ${storageKey}`);
      
      // Store new data
      await prisma.workflowData.create({
        data: {
          userId,
          storageKey,
          data: dataToStore,
          description,
          expiresAt,
        },
      });
    }

    // Log storage summary
    const dataSize = dataToStore.length;
    environment.log.info(`Data stored successfully: Key=${storageKey}, Size=${dataSize} chars, Expires=${expiresAt.toISOString()}`);

    // Set outputs
    environment.setOutput('Storage Key', storageKey);
    environment.setOutput('Stored Data', dataToStore);

    return true;
  } catch (error: any) {
    environment.log.error(`Store data failed: ${error.message}`);
    return false;
  }
}
