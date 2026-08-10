import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Falta configurar GEMINI_API_KEY en el archivo .env');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const geminiClient = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' 
});

export default geminiClient;