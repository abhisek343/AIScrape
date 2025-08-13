import { ExecutionEnvironment } from '@/types/executor';
import { HttpRequestTask } from '@/lib/workflow/task/http-request';
import { safeJsonParse } from '@/lib/safe-json';

// Security constants
const HTTP_TIMEOUT = 30000; // 30 seconds
const MAX_RESPONSE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

function validateHttpUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }
    
    // Block localhost and loopback
    if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(parsedUrl.hostname)) {
      return { valid: false, error: 'Cannot make requests to localhost or loopback addresses' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export async function HttpRequestExecutor(
  environment: ExecutionEnvironment<typeof HttpRequestTask>
): Promise<boolean> {
  try {
    const method = (environment.getInput('Method') || 'GET').toUpperCase();
    const url = environment.getInput('URL');
    const headersJson = environment.getInput('Headers (JSON)');
    const body = environment.getInput('Body');

    if (!url) {
      environment.log.error('URL not provided');
      return false;
    }

    // Validate HTTP method
    if (!ALLOWED_METHODS.includes(method)) {
      environment.log.error(`HTTP method '${method}' is not allowed`);
      return false;
    }

    // Validate URL
    const urlValidation = validateHttpUrl(url);
    if (!urlValidation.valid) {
      environment.log.error(`Invalid URL: ${urlValidation.error}`);
      return false;
    }

    const init: RequestInit = { method };

    // Add timeout control
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), HTTP_TIMEOUT);
    init.signal = abortController.signal;
    if (headersJson) {
      const headersParseResult = safeJsonParse(headersJson, {
        maxSize: 10240, // 10KB limit for headers
        maxDepth: 5
      });
      
      if (!headersParseResult.success) {
        environment.log.error(`Invalid headers JSON: ${headersParseResult.error}`);
        return false;
      }
      
      // Validate that parsed data is an object
      if (typeof headersParseResult.data !== 'object' || Array.isArray(headersParseResult.data)) {
        environment.log.error('Headers must be a JSON object');
        return false;
      }
      
      init.headers = headersParseResult.data;
    }
    if (body && method !== 'GET' && method !== 'HEAD') {
      // Validate body size
      if (body.length > 10 * 1024 * 1024) { // 10MB limit for request body
        environment.log.error('Request body exceeds maximum size of 10MB');
        return false;
      }
      init.body = body;
    }

    environment.log.info(`Making ${method} request to: ${url}`);

    const res = await fetch(url, init);
    clearTimeout(timeoutId);

    // Check response size
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      environment.log.error(`Response size ${contentLength} exceeds maximum of ${MAX_RESPONSE_SIZE} bytes`);
      return false;
    }

    const text = await res.text();

    // Check actual response size
    if (text.length > MAX_RESPONSE_SIZE) {
      environment.log.error(`Response size exceeds maximum of ${MAX_RESPONSE_SIZE} bytes`);
      const truncatedText = text.substring(0, 1000) + '...[truncated]';
      environment.setOutput('Status', String(res.status));
      environment.setOutput('Response body', truncatedText);
      return false;
    }

    environment.setOutput('Status', String(res.status));
    environment.setOutput('Response body', text);
    environment.log.info(`HTTP request completed with status: ${res.status}`);
    return true;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      environment.log.error(`HTTP request timed out after ${HTTP_TIMEOUT}ms`);
    } else {
      environment.log.error(`HTTP request failed: ${error.message}`);
    }
    return false;
  }
}





