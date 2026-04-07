import { WaitForElementTask } from '@/lib/workflow/task/wait-for-element';
import { getRequiredInput, getRequiredPage, logExecutorError } from '@/lib/workflow/executor/common';
import { ExecutionEnvironment } from '@/types/executor';

// Security constants
const MAX_SELECTOR_LENGTH = 1000;
const MAX_WAIT_TIMEOUT = 60000; // 60 seconds
const DEFAULT_TIMEOUT = 30000; // 30 seconds

function validateWaitForElementInputs(selector: string, visibility: string): { valid: boolean; error?: string } {
  if (!selector || typeof selector !== 'string' || selector.trim().length === 0) {
    return { valid: false, error: 'Selector is required and must be a non-empty string' };
  }

  if (selector.length > MAX_SELECTOR_LENGTH) {
    return { valid: false, error: `Selector exceeds maximum length of ${MAX_SELECTOR_LENGTH}` };
  }

  if (!visibility || typeof visibility !== 'string') {
    return { valid: false, error: 'Visibility is required and must be a string' };
  }

  if (!['visible', 'hidden'].includes(visibility)) {
    return { valid: false, error: 'Visibility must be either "visible" or "hidden"' };
  }

  return { valid: true };
}

export async function WaitForElementExecutor(
  environment: ExecutionEnvironment<typeof WaitForElementTask>
): Promise<boolean> {
  const selector = getRequiredInput(environment, 'Selector', 'input->selector not defined');
  if (!selector) return false;

  const visibility = getRequiredInput(environment, 'Visibility', 'input->visibility not defined');
  if (!visibility) return false;

  const timeoutInput = environment.getInput('Timeout');
  const timeout = timeoutInput ? parseInt(timeoutInput) : DEFAULT_TIMEOUT;

  if (isNaN(timeout) || timeout < 1000 || timeout > 300000) {
    environment.log.error('Invalid timeout. Must be between 1000ms and 300000ms');
    return false;
  }

  try {
    const page = getRequiredPage(environment);
    if (!page) return false;

    // Validate inputs
    const validation = validateWaitForElementInputs(selector, visibility);
    if (!validation.valid) {
      environment.log.error(`Wait for element validation failed: ${validation.error}`);
      return false;
    }

    environment.log.info(`Waiting for element '${selector}' to become ${visibility}`);

    // Wait for element with timeout
    await page.waitForSelector(selector, {
      visible: visibility === 'visible',
      hidden: visibility === 'hidden',
      timeout: timeout
    });

    environment.log.info(`Element ${selector} became ${visibility}`);
    return true;

  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      environment.log.error(`Timeout waiting for element '${selector}' to become ${visibility}`);
    } else {
      logExecutorError(environment, error, 'Wait for element failed');
    }
    return false;
  }
}
