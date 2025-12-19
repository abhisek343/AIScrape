import { DeliverViaWebhookTask } from '@/lib/workflow/task/deliver-via-webhook';
import { ExecutionEnvironment } from '@/types/executor';

// Security: URL validation and timeout constants
const WEBHOOK_TIMEOUT = 30000; // 30 seconds
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB
const FORBIDDEN_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
const FORBIDDEN_PORTS = [22, 23, 25, 53, 80, 110, 143, 993, 995];

function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }
    
    // Block forbidden hosts
    if (FORBIDDEN_HOSTS.includes(parsedUrl.hostname)) {
      return { valid: false, error: 'Cannot send webhooks to localhost or loopback addresses' };
    }
    
    // Block private IP ranges (basic check)
    if (parsedUrl.hostname.startsWith('192.168.') || 
        parsedUrl.hostname.startsWith('10.') ||
        parsedUrl.hostname.startsWith('172.')) {
      return { valid: false, error: 'Cannot send webhooks to private IP addresses' };
    }
    
    // Block forbidden ports
    const port = parseInt(parsedUrl.port) || (parsedUrl.protocol === 'https:' ? 443 : 80);
    if (FORBIDDEN_PORTS.includes(port)) {
      return { valid: false, error: `Port ${port} is not allowed for webhooks` };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export async function DeliverViaWebhookExecutor(
  environment: ExecutionEnvironment<typeof DeliverViaWebhookTask>
): Promise<boolean> {
  try {
    const targetUrl = environment.getInput('Target URL');
    if (!targetUrl) {
      environment.log.error('input->targetUrl not defined');
      return false;
    }

    // Validate URL
    const urlValidation = validateWebhookUrl(targetUrl);
    if (!urlValidation.valid) {
      environment.log.error(`Invalid webhook URL: ${urlValidation.error}`);
      return false;
    }

    const body = environment.getInput('Body');
    if (!body) {
      environment.log.error('input->body not defined');
      return false;
    }

    // Validate body size
    const bodyString = JSON.stringify(body);
    if (bodyString.length > 1024 * 1024) { // 1MB limit for request body
      environment.log.error('Request body exceeds maximum size of 1MB');
      return false;
    }

    environment.log.info(`Sending webhook to: ${targetUrl}`);

    // Create AbortController for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), WEBHOOK_TIMEOUT);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'AIScrape-Webhook/1.0'
      },
      body: bodyString,
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      environment.log.error(`Webhook failed with status code: ${response.status}`);
      return false;
    }

    // Handle response with size limits
    let responseText: string = '<no-body>';
    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length');
    
    // Check content length if provided
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      environment.log.error(`Response size ${contentLength} exceeds maximum of ${MAX_RESPONSE_SIZE} bytes`);
      return false;
    }

    try {
      if (contentType.includes('application/json')) {
        const json = await response.json();
        responseText = JSON.stringify(json, null, 2);
      } else {
        responseText = await response.text();
      }
      
      // Check actual response size
      if (responseText.length > MAX_RESPONSE_SIZE) {
        environment.log.error(`Response size exceeds maximum of ${MAX_RESPONSE_SIZE} bytes`);
        responseText = responseText.substring(0, 1000) + '...[truncated]';
      }
    } catch (err: any) {
      environment.log.warn(`Failed to read response body: ${err.message}`);
      responseText = '<error-reading-body>';
    }

    environment.log.info(`Webhook delivered successfully. Response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...[truncated]' : ''}`);
    return true;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      environment.log.error(`Webhook request timed out after ${WEBHOOK_TIMEOUT}ms`);
    } else {
      environment.log.error(`Webhook request failed: ${error.message}`);
    }
    return false;
  }
}
