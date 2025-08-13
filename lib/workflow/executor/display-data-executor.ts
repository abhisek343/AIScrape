import { DisplayDataTask } from '@/lib/workflow/task/display-data';
import { ExecutionEnvironment } from '@/types/executor';
import { safeJsonParse, safeJsonStringify } from '@/lib/safe-json';

export async function DisplayDataExecutor(
  environment: ExecutionEnvironment<typeof DisplayDataTask>
): Promise<boolean> {
  try {
    const dataToDisplay = environment.getInput('Data to Display');
    const displayTitle = environment.getInput('Display Title') || 'Extracted Data';
    const formatAs = environment.getInput('Format as JSON') || 'auto';

    if (!dataToDisplay) {
      environment.log.error('No data provided to display');
      return false;
    }

    // Validate data size
    if (dataToDisplay.length > 1000000) { // 1MB limit
      environment.log.error('Data to display exceeds maximum size of 1MB');
      return false;
    }

    let formattedData: string;
    let isJson: boolean = false;

    // Determine formatting
    if (formatAs === 'json') {
      // Force JSON formatting
      try {
        const parsed = JSON.parse(dataToDisplay);
        const stringifyResult = safeJsonStringify(parsed, { space: 2 });
        if (stringifyResult.success) {
          formattedData = stringifyResult.data;
          isJson = true;
        } else {
          environment.log.error(`Failed to format as JSON: ${stringifyResult.error}`);
          return false;
        }
      } catch (error) {
        environment.log.error('Data is not valid JSON and cannot be formatted as JSON');
        return false;
      }
    } else if (formatAs === 'text') {
      // Force text formatting
      formattedData = dataToDisplay;
      isJson = false;
    } else {
      // Auto-detect format
      try {
        const parsed = JSON.parse(dataToDisplay);
        const stringifyResult = safeJsonStringify(parsed, { space: 2 });
        if (stringifyResult.success) {
          formattedData = stringifyResult.data;
          isJson = true;
        } else {
          formattedData = dataToDisplay;
          isJson = false;
        }
      } catch (error) {
        // Not JSON, display as text
        formattedData = dataToDisplay;
        isJson = false;
      }
    }

    // Create a nice display format
    const displayHeader = `\n${'='.repeat(60)}\n${displayTitle.toUpperCase()}\n${'='.repeat(60)}`;
    const displayFooter = `${'='.repeat(60)}\n`;
    
    const fullDisplay = `${displayHeader}\n${formattedData}\n${displayFooter}`;

    // Log the formatted data for easy viewing
    environment.log.info(fullDisplay);

    // Also log data type and size info
    const dataType = isJson ? 'JSON' : 'Text';
    const dataSize = dataToDisplay.length;
    const formattedSize = formattedData.length;
    
    environment.log.info(`Data Summary: Type=${dataType}, Original Size=${dataSize} chars, Formatted Size=${formattedSize} chars`);

    // Store the formatted data as output for potential use by other nodes
    environment.setOutput('Displayed Data', formattedData);

    return true;
  } catch (error: any) {
    environment.log.error(`Display data failed: ${error.message}`);
    return false;
  }
}
