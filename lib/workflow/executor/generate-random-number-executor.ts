import { ExecutionEnvironment } from '@/types/executor';
import { GenerateRandomNumberTask } from '@/lib/workflow/task/generate-random-number';

// Constants for validation
const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;
const MAX_RANGE = 1000000; // Prevent excessive memory usage

export async function GenerateRandomNumberExecutor(
    environment: ExecutionEnvironment<typeof GenerateRandomNumberTask>
): Promise<boolean> {
    try {
        const minStr = environment.getInput('Min');
        const maxStr = environment.getInput('Max');

        let min = parseInt(minStr, 10);
        let max = parseInt(maxStr, 10);

        // Validate and set defaults
        if (isNaN(min) || !isFinite(min)) {
            min = DEFAULT_MIN;
            environment.log.info(`Invalid Min value, using default: ${DEFAULT_MIN}`);
        }
        if (isNaN(max) || !isFinite(max)) {
            max = DEFAULT_MAX;
            environment.log.info(`Invalid Max value, using default: ${DEFAULT_MAX}`);
        }
        
        // Ensure min <= max
        if (min > max) {
            environment.log.info(`Min (${min}) > Max (${max}), swapping values`);
            [min, max] = [max, min];
        }
        
        // Check range limits
        if (max - min > MAX_RANGE) {
            environment.log.error(`Range too large: ${max - min} exceeds maximum ${MAX_RANGE}`);
            return false;
        }

        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

        // Output as number for type consistency
        environment.setOutput('Random Number', String(randomNumber));
        environment.log.info(`Generated random number: ${randomNumber} (range: ${min}-${max})`);

        return true;
    } catch (error: any) {
        environment.log.error(`Random number generation failed: ${error.message}`);
        return false;
    }
}
