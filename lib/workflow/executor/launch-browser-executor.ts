import puppeteer, { Browser, Page } from 'puppeteer';

import { LaunchBrowserTask } from '@/lib/workflow/task/launch-browser';
import { ExecutionEnvironment } from '@/types/executor';
import { assertPublicScrapeTarget } from '@/lib/scraping/target-policy';
import { reserveScrapeSlot } from '@/lib/scraping/rate-limit';
import { assertRobotsAllowed } from '@/lib/scraping/robots-policy';
import { redisConnection } from '@/lib/queue/client';

// Security and resource management constants
const BROWSER_TIMEOUT = 60000; // 60 seconds for browser operations
const PAGE_LOAD_TIMEOUT = 30000; // 30 seconds for page load
const MAX_MEMORY_MB = 512; // 512MB memory limit per browser


async function setupSecurePage(page: Page): Promise<void> {
  // Set security headers and restrictions
  await page.setExtraHTTPHeaders({
    'User-Agent': 'AIScrape-Bot/1.0 (Security-Enhanced)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'DNT': '1',
    'Connection': 'keep-alive'
  });

  // Set viewport for consistency
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });

  // Block unnecessary resources to save bandwidth and improve performance
  await page.setRequestInterception(true);

  page.on('request', (request) => {
    void (async () => {
    const resourceType = request.resourceType();
    const url = request.url();

    // Re-check subresources and redirects so a public entry URL cannot turn
    // into a request to a loopback, private, or metadata endpoint.
    const targetError = await assertPublicScrapeTarget(url);
    if (targetError) {
      await request.abort();
      return;
    }

    // Block potentially dangerous or unnecessary resources
    if (resourceType === 'font' ||
      resourceType === 'media' ||
      url.includes('analytics') ||
      url.includes('tracking') ||
      url.includes('advertisement') ||
      url.includes('doubleclick') ||
      url.includes('googleads')) {
      await request.abort();
    } else if (resourceType === 'image' && request.url().match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
      // Allow images but with size limits handled by browser
      await request.continue();
    } else {
      await request.continue();
    }
    })().catch(() => void request.abort());
  });

  // Set timeouts
  page.setDefaultTimeout(PAGE_LOAD_TIMEOUT);
  page.setDefaultNavigationTimeout(PAGE_LOAD_TIMEOUT);
}

export async function LaunchBrowserExecutor(
  environment: ExecutionEnvironment<typeof LaunchBrowserTask>
): Promise<boolean> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    const websiteUrl = environment.getInput('Website Url');
    const timeoutInput = environment.getInput('Timeout');
    const timeout = timeoutInput ? parseInt(timeoutInput) : PAGE_LOAD_TIMEOUT;

    if (isNaN(timeout) || timeout < 1000 || timeout > 300000) {
      environment.log.error('Invalid timeout. Must be between 1000ms and 300000ms');
      return false;
    }

    // Validate website URL
    const targetError = await assertPublicScrapeTarget(websiteUrl);
    if (targetError) {
      environment.log.error(`Invalid website URL: ${targetError}`);
      return false;
    }
    const target = new URL(websiteUrl);
    const robotsError = await assertRobotsAllowed(target);
    if (robotsError) {
      environment.log.error(`Scrape target rejected: ${robotsError}`);
      return false;
    }
    if (!await reserveScrapeSlot(target.hostname, redisConnection.set.bind(redisConnection))) {
      environment.log.error('Rate limit reached for target host; retry the workflow later');
      return false;
    }

    environment.log.info(`Launching browser for URL: ${websiteUrl}`);

    // Launch or connect to browser with security settings
    if (process.env.BROWSER_MODE !== 'remote') {
      // Launch locally in dev with security restrictions
      browser = await Promise.race([
        puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-default-apps',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            `--memory-pressure-off`,
            `--max_old_space_size=${MAX_MEMORY_MB}`,
          ],
          timeout: BROWSER_TIMEOUT,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Browser launch timeout')), BROWSER_TIMEOUT)
        )
      ]);
      environment.log.info('Local browser launched successfully');
    } else {
      // Remote browser use is explicit: hosted deployments must opt in with
      // BROWSER_MODE=remote and a managed browser WebSocket endpoint.
      const wsEndpoint = process.env.BRIGHT_DATA_BROWSER_WS;
      if (!wsEndpoint) {
        environment.log.error('BRIGHT_DATA_BROWSER_WS is not configured');
        return false;
      }

      browser = await Promise.race([
        puppeteer.connect({
          browserWSEndpoint: wsEndpoint,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Browser connection timeout')), BROWSER_TIMEOUT)
        )
      ]);
      environment.log.info('Remote browser connected successfully');
    }

    // Set up browser cleanup on environment cleanup
    environment.setBrowser(browser);

    // Create and configure page
    page = await browser.newPage();
    await setupSecurePage(page);

    // Navigate with timeout and error handling
    environment.log.info(`Navigating to: ${websiteUrl}`);

    await Promise.race([
      page.goto(websiteUrl, {
        waitUntil: 'domcontentloaded', // Don't wait for all resources
        timeout: PAGE_LOAD_TIMEOUT
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Page load timeout')), PAGE_LOAD_TIMEOUT)
      )
    ]);

    // Verify page loaded successfully
    const currentUrl = page.url();
    if (!currentUrl || currentUrl === 'about:blank') {
      throw new Error('Page failed to load properly');
    }
    const finalTargetError = await assertPublicScrapeTarget(currentUrl);
    if (finalTargetError) throw new Error(`Redirected to an unsafe URL: ${finalTargetError}`);

    environment.setPage(page);
    environment.log.info(`Successfully opened page at: ${currentUrl}`);

    return true;
  } catch (error: any) {
    environment.log.error(`Browser launch failed: ${error.message}`);

    // Cleanup on failure
    try {
      if (page) {
        await page.close().catch(() => { });
      }
      if (browser) {
        await browser.close().catch(() => { });
      }
    } catch (cleanupError) {
      environment.log.warn(`Cleanup failed: ${cleanupError}`);
    }

    return false;
  }
}
