import { ExecutionEnvironment } from '@/types/executor';
import { RegexExtractTask } from '@/lib/workflow/task/regex-extract';

export async function RegexExtractExecutor(
  environment: ExecutionEnvironment<typeof RegexExtractTask>
): Promise<boolean> {
  try {
    const input = environment.getInput('Input');
    const pattern = environment.getInput('Pattern');
    const flags = environment.getInput('Flags');
    if (!input || !pattern) {
      environment.log.error('Missing inputs (Input, Pattern)');
      return false;
    }
    const regex = new RegExp(pattern, flags || 'g');
    const matches = Array.from(input.matchAll(regex)).map((m) => (m.length > 1 ? m.slice(1) : m[0]));
    environment.setOutput('Matches (JSON)', JSON.stringify(matches));
    return true;
  } catch (error: any) {
    environment.log.error(error.message);
    return false;
  }
}









