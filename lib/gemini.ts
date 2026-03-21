import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env.local');

const genAI = new GoogleGenerativeAI(apiKey);

export const flashModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
export const proModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

export async function askGemini(prompt: string, pro = false): Promise<string> {
  const model = pro ? proModel : flashModel;
  const result = await model.generateContent(prompt);
  return result.response.text();
}