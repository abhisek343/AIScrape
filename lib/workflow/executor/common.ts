import { Page } from 'puppeteer';

import { ExecutionEnvironment } from '@/types/executor';

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function getRequiredPage(environment: ExecutionEnvironment<any>): Page | null {
  const page = environment.getPage();
  if (!page) {
    environment.log.error('No page found');
    return null;
  }
  return page;
}

export function getRequiredInput(
  environment: ExecutionEnvironment<any>,
  name: string,
  errorMessage: string
): string | null {
  const value = environment.getInput(name);
  if (value === undefined || value === null || value === '') {
    environment.log.error(errorMessage);
    return null;
  }
  return value;
}

export function logExecutorError(
  environment: ExecutionEnvironment<any>,
  error: unknown,
  prefix?: string
) {
  const message = toErrorMessage(error);
  environment.log.error(prefix ? `${prefix}: ${message}` : message);
}
