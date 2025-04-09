import 'server-only'; // Assuming this was intended or should be here for server-side execution
// import OpenAI from 'openai'; // Remove this line

import prisma from '@/lib/prisma';
import { symmetricDecrypt } from '@/lib/encryption';
import { ExtractDataWithAiTask } from '@/lib/workflow/task/extract-data-with-ai';
import { ExecutionEnvironment } from '@/types/executor';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'; // Import Gemini

export async function ExtractDataWithAiExecutor(
  environment: ExecutionEnvironment<typeof ExtractDataWithAiTask>
): Promise<boolean> {
  try {
    const credentialsInput = environment.getInput('Credentials'); // This now refers to the credential name for Gemini API Key
    if (!credentialsInput) {
      environment.log.error('input->credentials not defined');
      return false;
    }

    const prompt = environment.getInput('Prompt');
    if (!prompt) {
      environment.log.error('input->prompt not defined');
      return false;
    }

    const content = environment.getInput('Content');
    if (!content) {
      environment.log.error('input->content not defined');
      return false;
    }

    // Get Gemini API Key from DB (stored via credentials)
    const credential = await prisma.credential.findUnique({
      where: { id: credentialsInput }, // Assuming 'credentials' input now holds the ID of the credential entry for Gemini API Key
    });

    if (!credential) {
      environment.log.error('Gemini API key credential not found');
      return false;
    }

    const geminiApiKey = symmetricDecrypt(credential.value);
    if (!geminiApiKey) {
      environment.log.error('Cannot decrypt Gemini API key credential');
      return false;
    }

    // Initialize the Google GenAI client
    const genAI = new GoogleGenerativeAI(geminiApiKey); // Use the decrypted key
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-05-20", // Or any other suitable Gemini model
      // You might want to add system instructions or safety settings here if needed
      // systemInstruction: "You are a webscraper helper...", (similar to your OpenAI setup)
      // safetySettings: [
      //   {
      //     category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      //     threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      //   },
      // ],
    });

    const fullPrompt = `
      You are a webscraper helper that extracts data from HTML or text.
      You will be given a piece of text or HTML content as input and also the prompt with the data you have to extract.
      The response should always be only the extracted data as a JSON array or object, without any additional words or explanations.
      Analyze the input carefully and extract data precisely based on the prompt. If no data is found, return an empty JSON array.
      Work only with the provided content and ensure the output is always a valid JSON array without any surrounding text.

      Content to analyze:
      ${content}

      Data to extract based on the following prompt:
      ${prompt}
    `;

    environment.log.info('Sending request to Gemini API...');

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      environment.log.error('Empty response from Gemini AI');
      return false;
    }

    // Potentially log token usage if available and needed, though Gemini API might handle this differently.
    // The `result.response.usageMetadata` might contain token info.
    // environment.log.info(`Token usage: ${JSON.stringify(response.usageMetadata)}`);


    environment.log.info('Data extracted successfully with Gemini AI.');
    environment.setOutput('Extracted data', text);

    return true;
  } catch (error: any) {
    environment.log.error(`Gemini API error: ${error.message}`);
    if (error.stack) {
      environment.log.error(error.stack);
    }
    // If the error object has more details (e.g., from the Gemini API response)
    if (error.response && error.response.data) {
        environment.log.error(`Gemini API response error data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}
