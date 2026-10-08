import type { Page } from 'puppeteer';

import type { ExecutionEnvironment } from '@/types/executor';

export function requirePage(environment: ExecutionEnvironment<any>): Page | null {
  const page = environment.getPage();
  if (!page) {
    environment.log.error('No page found');
    return null;
  }
  return page;
}

export function failExecutor(
  environment: ExecutionEnvironment<any>,
  error: unknown,
): false {
  environment.log.error(error instanceof Error ? error.message : String(error));
  return false;
}
