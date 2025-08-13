import { ExecutionEnvironment } from '@/types/executor';
import { EvaluateJsTask } from '@/lib/workflow/task/evaluate-js';

// Security: Define forbidden patterns and size limits
const FORBIDDEN_PATTERNS = [
  /require\s*\(/,
  /import\s+/,
  /eval\s*\(/,
  /Function\s*\(/,
  /setTimeout\s*\(/,
  /setInterval\s*\(/,
  /fetch\s*\(/,
  /XMLHttpRequest/,
  /document\.write/,
  /window\.location/,
  /localStorage/,
  /sessionStorage/,
  /indexedDB/,
  /webkitRequestFileSystem/,
  /navigator\.geolocation/,
  /navigator\.camera/,
  /navigator\.microphone/,
  /\.constructor/,
  /__proto__/,
  /prototype\.constructor/
];

const MAX_CODE_LENGTH = 10000; // 10KB limit
const EXECUTION_TIMEOUT = 10000; // 10 seconds

function validateJavaScriptCode(code: string): { isValid: boolean; error?: string } {
  // Check code length
  if (code.length > MAX_CODE_LENGTH) {
    return { isValid: false, error: `Code exceeds maximum length of ${MAX_CODE_LENGTH} characters` };
  }

  // Check for forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      return { isValid: false, error: `Code contains forbidden pattern: ${pattern.source}` };
    }
  }

  // Basic syntax validation - try to parse without executing
  try {
    new Function(`"use strict"; return (function() { ${code} })`);
  } catch (error) {
    return { isValid: false, error: `Syntax error: ${error}` };
  }

  return { isValid: true };
}

export async function EvaluateJsExecutor(
  environment: ExecutionEnvironment<typeof EvaluateJsTask>
): Promise<boolean> {
  try {
    const code = environment.getInput('Code');
    if (!code) {
      environment.log.error('Code not provided');
      return false;
    }

    // Validate the JavaScript code
    const validation = validateJavaScriptCode(code);
    if (!validation.isValid) {
      environment.log.error(`Code validation failed: ${validation.error}`);
      return false;
    }

    const page = environment.getPage();
    if (!page) {
      environment.log.error('No page found');
      return false;
    }

    environment.log.info('Executing validated JavaScript code in browser context');

    // Execute code with timeout and error handling
    const result = await Promise.race([
      page.evaluate((userCode) => {
        // Create a restricted execution context
        'use strict';
        try {
          // Disable access to dangerous globals
          const originalFetch = window.fetch;
          const originalXMLHttpRequest = window.XMLHttpRequest;
          const originalLocalStorage = window.localStorage;
          const originalSessionStorage = window.sessionStorage;
          
          // Temporarily disable dangerous APIs
          delete (window as any).fetch;
          delete (window as any).XMLHttpRequest;
          delete (window as any).localStorage;
          delete (window as any).sessionStorage;
          
          // Execute user code in restricted context
          const userFunction = new Function(`
            "use strict";
            return (function() {
              ${userCode}
            })();
          `);
          
          const result = userFunction();
          
          // Restore original APIs
          (window as any).fetch = originalFetch;
          (window as any).XMLHttpRequest = originalXMLHttpRequest;
          (window as any).localStorage = originalLocalStorage;
          (window as any).sessionStorage = originalSessionStorage;
          
          return result;
        } catch (error) {
          throw new Error(`Execution error: ${error}`);
        }
      }, code),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Code execution timeout')), EXECUTION_TIMEOUT)
      )
    ]);

    // Safely stringify the result
    let stringifiedResult: string;
    try {
      stringifiedResult = JSON.stringify(result, null, 2);
    } catch (error) {
      // Handle circular references or non-serializable objects
      stringifiedResult = String(result);
    }

    environment.setOutput('Result (stringified)', stringifiedResult);
    environment.log.info('JavaScript code executed successfully');
    return true;
  } catch (error: any) {
    environment.log.error(`JavaScript execution failed: ${error.message}`);
    return false;
  }
}


