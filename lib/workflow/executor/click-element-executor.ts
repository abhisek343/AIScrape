import { ClickElementTask } from '@/lib/workflow/task/click-element';
import { ExecutionEnvironment } from '@/types/executor';

// Security constants
const MAX_SELECTOR_LENGTH = 1000;
const FORBIDDEN_SELECTORS = [
  'script',
  'iframe',
  'object',
  'embed',
  'applet',
  'meta',
  'link',
  'style',
  'title',
  'head'
];

function validateSelector(selector: string): { valid: boolean; error?: string } {
  if (!selector || typeof selector !== 'string' || selector.trim().length === 0) {
    return { valid: false, error: 'Selector is required and must be a non-empty string' };
  }

  if (selector.length > MAX_SELECTOR_LENGTH) {
    return { valid: false, error: `Selector exceeds maximum length of ${MAX_SELECTOR_LENGTH}` };
  }

  // Check for forbidden selectors that could be dangerous
  for (const forbidden of FORBIDDEN_SELECTORS) {
    if (selector.toLowerCase().includes(forbidden.toLowerCase())) {
      return { valid: false, error: `Selector cannot target '${forbidden}' elements` };
    }
  }

  // Basic CSS selector validation
  try {
    // Simple validation - check if it looks like a valid CSS selector
    if (!/^[.#]?[a-zA-Z0-9_-]+(\[[^\]]*\])*(\.[a-zA-Z0-9_-]+)*(\:[a-zA-Z0-9_-]+)*$/.test(selector.trim())) {
      return { valid: false, error: 'Invalid CSS selector format' };
    }
  } catch {
    return { valid: false, error: 'Invalid selector format' };
  }

  return { valid: true };
}

export async function ClickElementExecutor(
  environment: ExecutionEnvironment<typeof ClickElementTask>
): Promise<boolean> {
  try {
    const selector = environment.getInput('Selector');
    const page = environment.getPage();
    
    if (!page) {
      environment.log.error('No page found');
      return false;
    }

    if (!selector) {
      environment.log.error('input->selector not defined');
      return false;
    }

    // Validate selector
    const validation = validateSelector(selector);
    if (!validation.valid) {
      environment.log.error(`Selector validation failed: ${validation.error}`);
      return false;
    }

    environment.log.info(`Clicking element with selector: ${selector}`);

    // Check if element exists before clicking
    const elementExists = await page.$(selector);
    if (!elementExists) {
      environment.log.error(`Element with selector '${selector}' not found`);
      return false;
    }

    // Click with timeout and error handling
    await page.click(selector, { timeout: 10000 });
    
    environment.log.info('Element clicked successfully');
    return true;
    
  } catch (error: any) {
    environment.log.error(`Click element failed: ${error.message}`);
    return false;
  }
}
