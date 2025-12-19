import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Manually parse .env to avoid dependency
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        envVars[key] = value;
    }
});

const apiKey = envVars['GOOGLE_API_KEY'];

if (!apiKey) {
    console.error("GOOGLE_API_KEY not found in .env");
    process.exit(1);
}

console.log("Found GOOGLE_API_KEY ending in: ..." + apiKey.slice(-5));

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function run() {
    try {
        const prompt = "Explain how AI works in 1 sentence.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("SUCCESS! Response:");
        console.log(text);
    } catch (error) {
        console.error("FAILURE:");
        console.error(error);
    }
}

run();
