import { ExecutionEnvironment } from '@/types/executor';
import { SetLocalStorageTask } from '@/lib/workflow/task/set-local-storage';

// Security constants
const MAX_KEY_LENGTH = 256;
const MAX_VALUE_LENGTH = 1024 * 1024; // 1MB
const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype', 'toString', 'valueOf'];

function validateLocalStorageInput(key: string, value: string): { valid: boolean; error?: string } {
  // Validate key
  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    return { valid: false, error: 'Key is required and must be a non-empty string' };
  }

  if (key.length > MAX_KEY_LENGTH) {
    return { valid: false, error: `Key exceeds maximum length of ${MAX_KEY_LENGTH}` };
  }

  // Check for forbidden keys
  for (const forbiddenKey of FORBIDDEN_KEYS) {
    if (key === forbiddenKey || key.startsWith(forbiddenKey + '.')) {
      return { valid: false, error: `Key cannot be '${forbiddenKey}' or start with '${forbiddenKey}.'` };
    }
  }

  // Validate value
  if (value && typeof value !== 'string') {
    return { valid: false, error: 'Value must be a string' };
  }

  if (value && value.length > MAX_VALUE_LENGTH) {
    return { valid: false, error: `Value exceeds maximum length of ${MAX_VALUE_LENGTH}` };
  }

  return { valid: true };
}

export async function SetLocalStorageExecutor(
  environment: ExecutionEnvironment<typeof SetLocalStorageTask>
): Promise<boolean> {
  try {
    const key = environment.getInput('Key');
    const value = environment.getInput('Value') || '';
    const page = environment.getPage();
    
    if (!page) {
      environment.log.error('No page found');
      return false;
    }
    
    if (!key) {
      environment.log.error('Key not provided');
      return false;
    }

    // Validate inputs
    const validation = validateLocalStorageInput(key, value);
    if (!validation.valid) {
      environment.log.error(`LocalStorage validation failed: ${validation.error}`);
      return false;
    }

    environment.log.info(`Setting localStorage key: ${key}`);
    
    await page.evaluate(
      ([k, v]) => {
        try {
          localStorage.setItem(k, v);
        } catch (error) {
          throw new Error(`Failed to set localStorage: ${error.message}`);
        }
      },
      [key, value]
    );
    
    environment.log.info('LocalStorage set successfully');
    return true;
    
  } catch (error: any) {
    environment.log.error(`Failed to set localStorage: ${error.message}`);
    return false;
  }
}





