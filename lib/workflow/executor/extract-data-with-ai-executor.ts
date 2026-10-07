import prisma from '@/lib/prisma';
import { symmetricDecrypt } from '@/lib/encryption';
import { ExtractDataWithAiTask } from '@/lib/workflow/task/extract-data-with-ai';
import { ExecutionEnvironment } from '@/types/executor';
import { GoogleGenAI } from '@google/genai';

const API_TIMEOUT = 60_000;
const MAX_PROMPT_CHARS = 10_000;
const MAX_CONTENT_CHARS = 500_000;
const MAX_RESPONSE_CHARS = 100_000;
const EXTRACTION_MODEL = process.env.GEMINI_EXTRACTION_MODEL || 'gemini-3.8-flash';

export async function ExtractDataWithAiExecutor(
  environment: ExecutionEnvironment<typeof ExtractDataWithAiTask>
): Promise<boolean> {
  try {
    const credentialsInput = environment.getInput('Credentials');
    const prompt = environment.getInput('Prompt');
    const content = environment.getInput('Content');

    if (!credentialsInput) {
      environment.log.error('input->credentials not defined');
      return false;
    }
    if (typeof prompt !== 'string' || !prompt.trim()) {
      environment.log.error('Prompt must be a non-empty string');
      return false;
    }
    if (prompt.length > MAX_PROMPT_CHARS) {
      environment.log.error(`Prompt exceeds maximum length of ${MAX_PROMPT_CHARS} characters`);
      return false;
    }
    if (typeof content !== 'string' || !content.trim()) {
      environment.log.error('Content must be a non-empty string');
      return false;
    }
    if (content.length > MAX_CONTENT_CHARS) {
      environment.log.error(`Content exceeds maximum length of ${MAX_CONTENT_CHARS} characters`);
      return false;
    }

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
    } catch {
      environment.log.error('Failed to decrypt Gemini API key credential');
      return false;
    }
    if (!geminiApiKey.trim()) {
      environment.log.error('Gemini API key credential is empty');
      return false;
    }

    const client = new GoogleGenAI({ apiKey: geminiApiKey });
    const contents = [
      'Extract data only from the supplied content according to the user request.',
      'Return valid JSON only. If nothing matches, return an empty JSON array.',
      '',
      'CONTENT:',
      content,
      '',
      'EXTRACTION REQUEST:',
      prompt,
    ].join('\n');

    environment.log.info(`Sending extraction request to ${EXTRACTION_MODEL}`);

    const response = await Promise.race([
      client.models.generateContent({
        model: EXTRACTION_MODEL,
        contents,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 4096,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API request timeout')), API_TIMEOUT)
      ),
    ]);

    const text = response.text || '';
    if (!text) {
      environment.log.error('Empty response from Gemini AI');
      return false;
    }
    if (text.length > MAX_RESPONSE_CHARS) {
      environment.log.error('Response from Gemini AI exceeds maximum length');
      return false;
    }

    try {
      JSON.parse(text);
    } catch {
      environment.log.error('Gemini response was not valid JSON');
      return false;
    }

    environment.setOutput('Extracted data', text);
    environment.log.info('Data extracted successfully with Gemini AI');
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    environment.log.error(`Gemini API request failed: ${message}`);
    return false;
  }
}
