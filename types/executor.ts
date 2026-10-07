import { Browser, Page } from 'puppeteer';

import { WorkflowTask } from '@/types/workflow';
import { LogCollector } from '@/types/log';

export type Environment = {
  browser?: Browser;
  page?: Page;

  // Auth/context
  userId?: string;
  executionId?: string;

  // Phases with nodeId/taskId as key
  phases: Record<
    string, //key: nodeId/taskId
    {
      inputs: Record<string, string>;
      outputs: Record<string, string>;
    }
  >;
};

export type ExecutionEnvironment<T extends WorkflowTask> = {
  getInput(name: T['inputs'][number]['name']): string;
  setOutput(name: T['outputs'][number]['name'], value: string): void;

  getBrowser(): Browser | undefined;
  setBrowser(browser: Browser): void;

  getPage(): Page | undefined;
  setPage(page: Page): void;

  // Access execution-scoped identifiers for credential scoping, logging and idempotency.
  getUserId(): string | undefined;
  getExecutionId(): string | undefined;
  getPhaseId(): string;

  log: LogCollector;
};
