import { DeliverViaWebhookTask } from '@/lib/workflow/task/deliver-via-webhook';
import { ExecutionEnvironment } from '@/types/executor';
import { fetchPublicUrl } from '@/lib/scraping/robots-policy';

const WEBHOOK_TIMEOUT = 30_000;
const MAX_REQUEST_SIZE = 1024 * 1024;
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024;

export async function DeliverViaWebhookExecutor(
  environment: ExecutionEnvironment<typeof DeliverViaWebhookTask>
): Promise<boolean> {
  const targetUrl = environment.getInput('Target URL');
  if (!targetUrl) {
    environment.log.error('input->targetUrl not defined');
    return false;
  }

  const body = environment.getInput('Body');
  if (body === undefined || body === null || body === '') {
    environment.log.error('input->body not defined');
    return false;
  }

  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  if (bodyString.length > MAX_REQUEST_SIZE) {
    environment.log.error('Request body exceeds maximum size of 1MB');
    return false;
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), WEBHOOK_TIMEOUT);

  try {
    environment.log.info(`Sending webhook to: ${targetUrl}`);

    // Use the same DNS-pinned, redirect-validating transport as scraper HTTP
    // requests. This prevents hostname and redirect based SSRF bypasses.
    const executionId = environment.getExecutionId();
    const phaseId = environment.getPhaseId();
    const idempotencyKey = executionId ? `aiscrape:${executionId}:${phaseId}` : `aiscrape:${phaseId}`;

    const response = await fetchPublicUrl(
      targetUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AIScrape-Webhook/1.0',
          'Idempotency-Key': idempotencyKey,
          ...(executionId ? { 'X-AIScrape-Execution-Id': executionId } : {}),
        },
        body: bodyString,
        signal: abortController.signal,
      },
      { maxResponseBytes: MAX_RESPONSE_SIZE }
    );

    if (!response.ok) {
      response.discardBody?.();
      environment.log.error(`Webhook failed with status code: ${response.status ?? 'unknown'}`);
      return false;
    }

    const responseText = await response.text();
    environment.log.info(
      `Webhook delivered successfully. Response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...[truncated]' : ''}`
    );
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (abortController.signal.aborted) {
      environment.log.error(`Webhook request timed out after ${WEBHOOK_TIMEOUT}ms`);
    } else {
      environment.log.error(`Webhook request failed: ${message}`);
    }
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
