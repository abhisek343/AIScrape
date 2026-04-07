import { ExecutionEnvironment } from '@/types/executor';
import { RegexExtractTask } from '@/lib/workflow/task/regex-extract';

// Security: Maximum regex execution time to prevent ReDoS
const MAX_REGEX_TIME_MS = 5000;
const MAX_PATTERN_LENGTH = 1000;
const MAX_INPUT_LENGTH = 100000;

function validateRegexPattern(pattern: string): { valid: boolean; error?: string } {
  if (!pattern || typeof pattern !== 'string') {
    return { valid: false, error: 'Pattern is required' };
  }
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return { valid: false, error: `Pattern exceeds maximum length of ${MAX_PATTERN_LENGTH}` };
  }
  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /\(\?\!\)/, // Negative lookahead that could cause issues
    /\(\?\<\!\)/, // Negative lookbehind
    /\(\?\:.*\)\{\d+,\}/, // Quantified non-capturing groups
  ];
  for (const dangerous of dangerousPatterns) {
    if (dangerous.test(pattern)) {
      return { valid: false, error: 'Pattern contains potentially dangerous constructs' };
    }
  }
  return { valid: true };
}

async function safeRegexMatch(pattern: string, flags: string, input: string): Promise<(string | string[])[]> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Regex execution timeout - possible ReDoS attack'));
    }, MAX_REGEX_TIME_MS);
    
    try {
      const regex = new RegExp(pattern, flags || 'g');
      const matches = Array.from(input.matchAll(regex)).map((m) => (m.length > 1 ? m.slice(1) : m[0]));
      clearTimeout(timeoutId);
      resolve(matches);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

export async function RegexExtractExecutor(
  environment: ExecutionEnvironment<typeof RegexExtractTask>
): Promise<boolean> {
  try {
    const input = environment.getInput('Input');
    const pattern = environment.getInput('Pattern');
    const flags = environment.getInput('Flags');
    
    if (!input || !pattern) {
      environment.log.error('Missing inputs (Input, Pattern)');
      return false;
    }
    
    if (input.length > MAX_INPUT_LENGTH) {
      environment.log.error(`Input exceeds maximum length of ${MAX_INPUT_LENGTH}`);
      return false;
    }
    
    const validation = validateRegexPattern(pattern);
    if (!validation.valid) {
      environment.log.error(`Pattern validation failed: ${validation.error}`);
      return false;
    }
    
    const matches = await safeRegexMatch(pattern, flags || 'g', input);
    environment.setOutput('Matches (JSON)', JSON.stringify(matches));
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}
