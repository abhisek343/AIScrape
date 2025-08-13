import { ExecutionEnvironment } from '@/types/executor';
import { SetCookiesTask } from '@/lib/workflow/task/set-cookies';
import { safeJsonParse } from '@/lib/safe-json';

// Security constants
const MAX_COOKIES = 50;
const MAX_COOKIE_NAME_LENGTH = 256;
const MAX_COOKIE_VALUE_LENGTH = 4096;
const FORBIDDEN_COOKIE_NAMES = ['__Secure-', '__Host-', 'HttpOnly', 'Secure', 'SameSite'];

function validateCookie(cookie: any): { valid: boolean; error?: string } {
  if (!cookie || typeof cookie !== 'object') {
    return { valid: false, error: 'Cookie must be an object' };
  }

  // Validate required fields
  if (!cookie.name || typeof cookie.name !== 'string') {
    return { valid: false, error: 'Cookie name is required and must be a string' };
  }

  if (!cookie.value || typeof cookie.value !== 'string') {
    return { valid: false, error: 'Cookie value is required and must be a string' };
  }

  // Validate name length
  if (cookie.name.length > MAX_COOKIE_NAME_LENGTH) {
    return { valid: false, error: `Cookie name exceeds maximum length of ${MAX_COOKIE_NAME_LENGTH}` };
  }

  // Validate value length
  if (cookie.value.length > MAX_COOKIE_VALUE_LENGTH) {
    return { valid: false, error: `Cookie value exceeds maximum length of ${MAX_COOKIE_VALUE_LENGTH}` };
  }

  // Check for forbidden names
  for (const forbiddenName of FORBIDDEN_COOKIE_NAMES) {
    if (cookie.name.startsWith(forbiddenName)) {
      return { valid: false, error: `Cookie name cannot start with '${forbiddenName}'` };
    }
  }

  // Validate domain if provided
  if (cookie.domain && typeof cookie.domain === 'string') {
    try {
      new URL(`http://${cookie.domain}`);
    } catch {
      return { valid: false, error: 'Invalid cookie domain format' };
    }
  }

  // Validate path if provided
  if (cookie.path && typeof cookie.path === 'string') {
    if (!cookie.path.startsWith('/')) {
      return { valid: false, error: 'Cookie path must start with /' };
    }
  }

  return { valid: true };
}

export async function SetCookiesExecutor(
  environment: ExecutionEnvironment<typeof SetCookiesTask>
): Promise<boolean> {
  try {
    const cookiesJson = environment.getInput('Cookies (JSON)');
    const page = environment.getPage();
    
    if (!page) {
      environment.log.error('No page found');
      return false;
    }
    
    if (!cookiesJson) {
      environment.log.error('Cookies JSON not provided');
      return false;
    }

    // Safely parse cookies JSON
    const parseResult = safeJsonParse(cookiesJson, {
      maxSize: 10240, // 10KB limit
      maxDepth: 5
    });

    if (!parseResult.success) {
      environment.log.error(`Invalid cookies JSON: ${parseResult.error}`);
      return false;
    }

    const cookies = parseResult.data;

    // Validate that it's an array
    if (!Array.isArray(cookies)) {
      environment.log.error('Cookies must be an array');
      return false;
    }

    // Check array length
    if (cookies.length > MAX_COOKIES) {
      environment.log.error(`Too many cookies. Maximum allowed: ${MAX_COOKIES}`);
      return false;
    }

    // Validate each cookie
    for (let i = 0; i < cookies.length; i++) {
      const validation = validateCookie(cookies[i]);
      if (!validation.valid) {
        environment.log.error(`Cookie ${i + 1} validation failed: ${validation.error}`);
        return false;
      }
    }

    environment.log.info(`Setting ${cookies.length} cookies`);
    await page.setCookie(...cookies);
    
    environment.log.info('Cookies set successfully');
    return true;
    
  } catch (error: any) {
    environment.log.error(`Failed to set cookies: ${error.message}`);
    return false;
  }
}





