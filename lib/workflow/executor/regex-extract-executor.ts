import { Worker } from 'node:worker_threads';

import { ExecutionEnvironment } from '@/types/executor';
import { RegexExtractTask } from '@/lib/workflow/task/regex-extract';

const MAX_REGEX_TIME_MS = 5_000;
const MAX_PATTERN_LENGTH = 1_000;
const MAX_INPUT_LENGTH = 100_000;
const MAX_MATCHES = 10_000;

function validateRegexPattern(pattern: string): { valid: boolean; error?: string } {
  if (!pattern || typeof pattern !== 'string') {
    return { valid: false, error: 'Pattern is required' };
  }
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return { valid: false, error: `Pattern exceeds maximum length of ${MAX_PATTERN_LENGTH}` };
  }
  return { valid: true };
}

function runRegexInWorker(
  pattern: string,
  flags: string,
  input: string,
): Promise<(string | string[])[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      `
      const { parentPort, workerData } = require('node:worker_threads');

      try {
        let flags = workerData.flags || 'g';
        if (!flags.includes('g')) flags += 'g';

        const regex = new RegExp(workerData.pattern, flags);
        const matches = [];
        for (const match of workerData.input.matchAll(regex)) {
          matches.push(match.length > 1 ? match.slice(1) : match[0]);
          if (matches.length > workerData.maxMatches) {
            throw new Error('Regex produced too many matches');
          }
        }

        parentPort.postMessage({ ok: true, matches });
      } catch (error) {
        parentPort.postMessage({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      `,
      {
        eval: true,
        workerData: { pattern, flags, input, maxMatches: MAX_MATCHES },
      },
    );

    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      callback();
    };

    const timeoutId = setTimeout(() => {
      finish(() => {
        void worker.terminate();
        reject(new Error('Regex execution timed out'));
      });
    }, MAX_REGEX_TIME_MS);

    worker.once('message', (message) => {
      finish(() => {
        void worker.terminate();
        if (message?.ok) resolve(message.matches);
        else reject(new Error(message?.error || 'Regex execution failed'));
      });
    });

    worker.once('error', (error) => {
      finish(() => {
        void worker.terminate();
        reject(error);
      });
    });

    worker.once('exit', (code) => {
      if (code !== 0) {
        finish(() => reject(new Error(`Regex worker exited with code ${code}`)));
      }
    });
  });
}

export async function RegexExtractExecutor(
  environment: ExecutionEnvironment<typeof RegexExtractTask>
): Promise<boolean> {
  try {
    const input = environment.getInput('Input');
    const pattern = environment.getInput('Pattern');
    const flags = environment.getInput('Flags') || 'g';

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

    const matches = await runRegexInWorker(pattern, flags, input);
    environment.setOutput('Matches (JSON)', JSON.stringify(matches));
    return true;
  } catch (error: unknown) {
    environment.log.error(error instanceof Error ? error.message : String(error));
    return false;
  }
}
