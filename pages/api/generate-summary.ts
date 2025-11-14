import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { DailyReportData, AIService } from '@/lib/aiService';

// This is the server-side API route.
// It is secure to use the API key here.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY environment variable is not set.');
}

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

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

  if (!openai) {
    return res.status(500).json({ error: 'OpenAI API key not configured.' });
  }

  try {
    // We can re-use the prompt building logic from the AIService
    // @ts-ignore - Accessing private static methods for reuse
    const detailedPrompt = AIService.buildDetailedPrompt(reportData);
    // @ts-ignore
    const concisePrompt = AIService.buildConcisePrompt(reportData);

    const [detailedResult, summaryResult] = await Promise.all([
      openai.responses.create({
        model: 'gpt-4o-mini',
        input: detailedPrompt,
      }),
      openai.responses.create({
        model: 'gpt-4o-mini',
        input: concisePrompt,
      })
    ]);

    const detailed = (detailedResult.output_text || '').trim();
    const summary = (summaryResult.output_text || '').trim();

    res.status(200).json({ detailed, summary });

  } catch (error) {
    console.error('Error calling OpenAI API in /api/generate-summary:', error);
    res.status(500).json({ error: 'Failed to generate AI summary.' });
  }
}
