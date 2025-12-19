import puppeteer, { Browser, Page } from 'puppeteer';

import { LaunchBrowserTask } from '@/lib/workflow/task/launch-browser';
import { ExecutionEnvironment } from '@/types/executor';

// Security and resource management constants
const BROWSER_TIMEOUT = 60000; // 60 seconds for browser operations
const PAGE_LOAD_TIMEOUT = 30000; // 30 seconds for page load
const MAX_MEMORY_MB = 512; // 512MB memory limit per browser
const FORBIDDEN_PROTOCOLS = ['file:', 'ftp:', 'data:', 'blob:', 'javascript:'];
const FORBIDDEN_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];

function validateWebsiteUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return { valid: false, error: 'Website URL is required' };
  }

  // Remove trailing whitespace and normalize
  url = url.trim();

  try {
    const parsedUrl = new URL(url);

    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }

    // Block forbidden protocols
    if (FORBIDDEN_PROTOCOLS.includes(parsedUrl.protocol)) {
      return { valid: false, error: `Protocol ${parsedUrl.protocol} is not allowed` };
    }

    // Block forbidden hosts
    if (FORBIDDEN_HOSTS.includes(parsedUrl.hostname)) {
      return { valid: false, error: 'Cannot navigate to localhost or loopback addresses' };
    }

    // Block Cloud Metadata Service (AWS/GCP/Azure)
    if (parsedUrl.hostname === '169.254.169.254') {
      return { valid: false, error: 'Access to cloud metadata service is forbidden' };
    }

    // Block private IP ranges (Enhanced check)
    const hostname = parsedUrl.hostname;
    if (
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./) || // 172.16.x.x - 172.31.x.x
      hostname === '::1' ||
      hostname.match(/^fd[0-9a-f]{2}:/i) // IPv6 Unique Local
    ) {
      return { valid: false, error: 'Cannot navigate to private IP addresses' };
    }

    // Validate URL length
    if (url.length > 2048) {
      return { valid: false, error: 'URL exceeds maximum length of 2048 characters' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

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
    const resourceType = request.resourceType();
    const url = request.url();

    // Block potentially dangerous or unnecessary resources
    if (resourceType === 'font' ||
      resourceType === 'media' ||
      url.includes('analytics') ||
      url.includes('tracking') ||
      url.includes('advertisement') ||
      url.includes('doubleclick') ||
      url.includes('googleads')) {
      request.abort();
    } else if (resourceType === 'image' && request.url().match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
      // Allow images but with size limits handled by browser
      request.continue();
    } else {
      request.continue();
    }
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

    // Validate website URL
    const urlValidation = validateWebsiteUrl(websiteUrl);
    if (!urlValidation.valid) {
      environment.log.error(`Invalid website URL: ${urlValidation.error}`);
      return false;
    }

    environment.log.info(`Launching browser for URL: ${websiteUrl}`);

    // Launch or connect to browser with security settings
    if (process.env.NODE_ENV !== 'production') {
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
      // Connect to BrightData in production
      const wsEndpoint = process.env.BRIGHT_DATA_BROWSER_WS;
      if (!wsEndpoint) {
        environment.log.error('BRIGHT_DATA_BROWSER_WS is not configured');
        return false;
      }

      browser = await Promise.race([
        puppeteer.connect({
          browserWSEndpoint: wsEndpoint,
          timeout: BROWSER_TIMEOUT,
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
