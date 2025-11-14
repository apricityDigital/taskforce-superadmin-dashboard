import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ComplianceReport, RejectionAnalysisResult } from '@/lib/dataService';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY environment variable is not set. Rejection analysis will fall back to a basic summary.');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

interface RejectionAnalysisRequest {
  report: ComplianceReport;
  adminNotes?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!genAI) {
    return res.status(500).json({ error: 'Gemini API key not configured.' });
  }

  const { report, adminNotes }: RejectionAnalysisRequest = req.body;

  if (!report) {
    return res.status(400).json({ error: 'Missing report payload.' });
  }

  try {
    const prompt = buildPrompt(report, adminNotes);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const analysis = normalizeGeminiOutput(text, report);
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Error generating rejection analysis:', error);
    const fallback: RejectionAnalysisResult = {
      reason: 'Automatic AI analysis failed. Please reference admin notes.',
      validationSummary: adminNotes
        ? `Manual reviewer comments: ${adminNotes}`
        : 'No admin notes supplied. Provide additional details for this rejection.',
      reviewedPhotos: collectReportPhotoUrls(report),
      aiModel: 'gemini-pro (fallback)',
      generatedAt: new Date().toISOString()
    };
    return res.status(200).json(fallback);
  }
}

function buildPrompt(report: ComplianceReport, adminNotes?: string): string {
  const answers = (report.answers || [])
    .map((answer, index) => {
      const label = answer.questionId || `question_${index + 1}`;
      const desc = answer.description ? ` | notes: ${answer.description}` : '';
      return `- ${label}: ${answer.answer || 'no response'}${desc}`;
    })
    .join('\n') || 'No structured answers were submitted.';

  const photoUrls = collectReportPhotoUrls(report);
  const photosSection = photoUrls.length
    ? photoUrls.map((url, index) => `${index + 1}. ${url}`).join('\n')
    : 'No photo URLs were provided.';

  return `
You are Gemini, acting as a compliance investigator for municipal feeder-point inspections.
An inspector rejected the following report. Review every answer and each photo URL to validate accuracy and determine the precise rejection reason.

Instructions:
1. Identify the exact operational or compliance breach justifying rejection. Be specific (e.g., "vehicle absent during Trip 2", "mixed waste observed in photo 2").
2. Validate all provided data points (distance, timestamps, answers) and highlight contradictions or supporting evidence.
3. Carefully review the listed photo URLs and describe what they confirm or contradict.
4. Respond ONLY in JSON with this schema:
{
  "reason": "one concise sentence naming the rejection cause",
  "validationSummary": "2-3 sentences summarizing how answers + photos justify the decision",
  "photoFindings": ["short note per key photo or 'No photos available'"]
}

Context:
- Report ID: ${report.id || 'N/A'}
- Feeder Point: ${report.feederPointName || 'Unknown'}
- Trip Number: ${report.tripNumber || 'Not specified'}
- Distance From Point: ${report.distanceFromFeederPoint ?? 'Not captured'} meters
- Submitted By: ${report.userName || report.submittedBy || 'Unknown'}
- Admin Notes: ${adminNotes || report.adminNotes || 'None provided'}

Question Responses:
${answers}

Photo Evidence URLs:
${photosSection}

Return JSON only, no markdown or commentary.
`;
}

function normalizeGeminiOutput(text: string, report: ComplianceReport): RejectionAnalysisResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  let parsed: { reason?: string; validationSummary?: string; photoFindings?: string[] } | null = null;
  if (jsonMatch) {
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      parsed = null;
    }
  }

  const photoFindings = parsed?.photoFindings?.length
    ? parsed.photoFindings.join(' | ')
    : 'Photo findings unavailable.';

  const validationSummary = parsed?.validationSummary
    ? `${parsed.validationSummary}${photoFindings ? ` | Photo Insights: ${photoFindings}` : ''}`
    : `Gemini summary unavailable. Raw output: ${text.trim().slice(0, 400)}...`;

  return {
    reason: parsed?.reason || 'Gemini did not return a parsable reason.',
    validationSummary,
    reviewedPhotos: collectReportPhotoUrls(report),
    aiModel: 'gemini-pro',
    generatedAt: new Date().toISOString()
  };
}

function collectReportPhotoUrls(report: ComplianceReport): string[] {
  const urls = new Set<string>();
  report.attachments?.forEach(attachment => {
    if (attachment.url) {
      urls.add(attachment.url);
    }
  });
  report.answers?.forEach(answer => {
    answer.photos?.forEach(photo => {
      if (photo) {
        urls.add(photo);
      }
    });
  });
  return Array.from(urls);
}
