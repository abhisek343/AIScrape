import { ReadPropertyFromJsonTask } from '@/lib/workflow/task/read-property-from-json';
import { ExecutionEnvironment } from '@/types/executor';
import { safeJsonParse } from '@/lib/safe-json';

export async function ReadPropertyFromJsonExecutor(
  environment: ExecutionEnvironment<typeof ReadPropertyFromJsonTask>
): Promise<boolean> {
  try {
    const jsonData = environment.getInput('JSON');
    if (!jsonData) {
      environment.log.error('input->JSON not defined');
      return false;
    }

    const propertyName = environment.getInput('Property name');
    if (!propertyName) {
      environment.log.error('input->propertyName not defined');
      return false;
    }

    // Safely parse JSON data
    const jsonParseResult = safeJsonParse(jsonData, {
      maxSize: 10 * 1024 * 1024, // 10MB limit
      maxDepth: 20
    });

    if (!jsonParseResult.success) {
      environment.log.error(`Failed to parse JSON: ${jsonParseResult.error}`);
      return false;
    }

    // Validate property name
    if (propertyName.includes('__') || propertyName === 'constructor' || propertyName === 'prototype') {
      environment.log.error(`Forbidden property name: ${propertyName}`);
      return false;
    }

    const json = jsonParseResult.data;
    const propertyValue = json[propertyName];
    if (propertyValue === undefined) {
      environment.log.error('Property not found');
      return false;
    }

    environment.setOutput('Property value', propertyValue);

    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}
