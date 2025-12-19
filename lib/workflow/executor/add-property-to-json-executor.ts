import { AddPropertyToJsonTask } from '@/lib/workflow/task/add-property-to-json';
import { ExecutionEnvironment } from '@/types/executor';
import { safeJsonParse, safeJsonStringify } from '@/lib/safe-json';

export async function AddPropertyToJsonExecutor(
  environment: ExecutionEnvironment<typeof AddPropertyToJsonTask>
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

    const propertyValue = environment.getInput('Property value');
    if (propertyValue === undefined) {
      environment.log.error('input->propertyValue not defined');
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

    // Validate that parsed data is an object
    if (typeof jsonParseResult.data !== 'object' || Array.isArray(jsonParseResult.data)) {
      environment.log.error('JSON data must be an object to add properties');
      return false;
    }

    // Validate property name
    if (propertyName.includes('__') || propertyName === 'constructor' || propertyName === 'prototype') {
      environment.log.error(`Forbidden property name: ${propertyName}`);
      return false;
    }

    const json = jsonParseResult.data;
    json[propertyName] = propertyValue;

    // Safely stringify the result
    const stringifyResult = safeJsonStringify(json);
    if (!stringifyResult.success) {
      environment.log.error(`Failed to stringify JSON: ${stringifyResult.error}`);
      return false;
    }

    environment.setOutput('Updated JSON', stringifyResult.data);

    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}
