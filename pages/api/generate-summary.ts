import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DailyReportData, AIService } from '@/lib/aiService';

// This is the server-side API route.
// It is secure to use the API key here.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY environment variable is not set.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const reportData: DailyReportData = req.body;

  if (!reportData) {
    return res.status(400).json({ error: 'Bad Request: Missing report data.' });
  }

  try {
    // We can re-use the prompt building logic from the AIService
    // @ts-ignore - Accessing private static methods for reuse
    const detailedPrompt = AIService.buildDetailedPrompt(reportData);
    // @ts-ignore
    const concisePrompt = AIService.buildConcisePrompt(reportData);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const [detailedResult, summaryResult] = await Promise.all([
      model.generateContent(detailedPrompt),
      model.generateContent(concisePrompt)
    ]);

    const detailed = detailedResult.response.text();
    const summary = summaryResult.response.text();

    res.status(200).json({ detailed, summary });

  } catch (error) {
    console.error('Error calling Gemini API in /api/generate-summary:', error);
    res.status(500).json({ error: 'Failed to generate AI summary.' });
  }
}
