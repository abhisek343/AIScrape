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

    // Validate prompt length and content
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      environment.log.error('Prompt must be a non-empty string');
      return false;
    }

    if (prompt.length > 10000) { // 10KB limit for prompts
      environment.log.error('Prompt exceeds maximum length of 10,000 characters');
      return false;
    }

    // Sanitize prompt - remove potential injection attempts
    const sanitizedPrompt = prompt
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .trim();

    const content = environment.getInput('Content');
    if (!content) {
      environment.log.error('input->content not defined');
      return false;
    }

    // Validate content length
    if (typeof content !== 'string' || content.trim().length === 0) {
      environment.log.error('Content must be a non-empty string');
      return false;
    }

    if (content.length > 1000000) { // 1MB limit for content
      environment.log.error('Content exceeds maximum length of 1,000,000 characters');
      return false;
    }

    // Basic content sanitization for HTML content
    const sanitizedContent = content.length > 500000 
      ? content.substring(0, 500000) + '...[truncated]' // Truncate very large content
      : content;

    // Get Gemini API Key from DB (stored via credentials)
    const userId = environment.getUserId();
    if (!userId) {
      environment.log.error('Missing user context');
      return false;
    }

    const credential = await prisma.credential.findFirst({
      where: { id: credentialsInput, userId },
    });

    if (!credential) {
      environment.log.error('Gemini API key credential not found');
      return false;
    }

    let geminiApiKey: string;
    try {
      geminiApiKey = symmetricDecrypt(credential.value);
    } catch (error) {
      environment.log.error('Failed to decrypt Gemini API key credential');
      return false;
    }

    if (!geminiApiKey || geminiApiKey.trim().length === 0) {
      environment.log.error('Cannot decrypt Gemini API key credential or key is empty');
      return false;
    }

    // Validate API key format (basic validation)
    if (!geminiApiKey.startsWith('AIzaSy') || geminiApiKey.length < 30) {
      environment.log.error('Invalid Gemini API key format');
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
      ${sanitizedContent}

      Data to extract based on the following prompt:
      ${sanitizedPrompt}
    `;

    environment.log.info('Sending request to Gemini API...');

    // Add timeout control for API request
    const API_TIMEOUT = 60000; // 60 seconds timeout

    try {
      const result = await Promise.race([
        model.generateContent(fullPrompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gemini API request timeout')), API_TIMEOUT)
        )
      ]) as any;

      const response = result.response;
      const text = response.text();

      if (!text) {
        environment.log.error('Empty response from Gemini AI');
        return false;
      }

      // Validate response length
      if (text.length > 100000) { // 100KB limit for responses
        environment.log.error('Response from Gemini AI exceeds maximum length');
        return false;
      }

      // Validate that the response is valid JSON
      try {
        JSON.parse(text);
      } catch (jsonError) {
        environment.log.error('Response from Gemini AI is not valid JSON, attempting to clean up...');
        // Try to extract JSON from the response if it's wrapped in markdown or other text
        const jsonMatch = text.match(/\[.*\]|\{.*\}/s);
        if (jsonMatch) {
          try {
            JSON.parse(jsonMatch[0]);
            environment.setOutput('Extracted data', jsonMatch[0]);
            environment.log.info('Data extracted successfully with Gemini AI (cleaned up)');
            return true;
          } catch (cleanupError) {
            environment.log.error('Could not extract valid JSON from Gemini AI response');
            return false;
          }
        } else {
          environment.log.error('No JSON structure found in Gemini AI response');
          return false;
        }
      }

      // Log token usage if available
      if (response.usageMetadata) {
        environment.log.info(`Token usage: ${JSON.stringify(response.usageMetadata)}`);
      }

      environment.log.info('Data extracted successfully with Gemini AI');
      environment.setOutput('Extracted data', text);
      return true;

    } catch (apiError: any) {
      environment.log.error(`Gemini API request failed: ${apiError.message}`);
      return false;
    }
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
