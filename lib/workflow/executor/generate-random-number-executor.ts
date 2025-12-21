import { ExecutionEnvironment } from '@/types/executor';
import { GenerateRandomNumberTask } from '@/lib/workflow/task/generate-random-number';

export async function GenerateRandomNumberExecutor(
    environment: ExecutionEnvironment<typeof GenerateRandomNumberTask>
): Promise<boolean> {
    try {
        const minStr = environment.getInput('Min');
        const maxStr = environment.getInput('Max');

        let min = parseInt(minStr, 10);
        let max = parseInt(maxStr, 10);

        if (isNaN(min)) min = 0;
        if (isNaN(max)) max = 100;

        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

        environment.setOutput('Random Number', randomNumber.toString());

        return true;
    } catch (error: any) {
        environment.log.error(error.message);
        return false;
    }
}
