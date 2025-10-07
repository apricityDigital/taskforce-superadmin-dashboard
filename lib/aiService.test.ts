import { DailyReportData } from './aiService';

describe('AIService', () => {
  const mockReportData: DailyReportData = {
    date: '2025-10-07',
    metrics: {
      totalUsers: 100,
      newRegistrations: 5,
      totalComplaints: 20,
      resolvedComplaints: 15,
      activeFeederPoints: 10,
      completedInspections: 18,
    },
    performance: {
      complaintResolutionRate: 75,
      userGrowth: 5,
      operationalEfficiency: 90,
    },
    rawReports: [],
  };

  beforeEach(() => {
    jest.resetModules();
  });

  it('should generate analysis using the Gemini API', async () => {
    process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'test-key';
    const mockGenerateContent = jest.fn().mockResolvedValue({ response: { text: () => 'summary' } });
    const mockGetGenerativeModel = jest.fn(() => ({ generateContent: mockGenerateContent }));
    jest.mock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      })),
    }));

    const { AIService } = await import('./aiService');
    const result = await AIService.generateAnalysis(mockReportData);

    expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-pro' });
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ detailed: 'summary', summary: 'summary' });
  });

  it('should fall back to simulation when Gemini API fails', async () => {
    process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'test-key';
    const mockGenerateContent = jest.fn().mockRejectedValue(new Error('API Error'));
    const mockGetGenerativeModel = jest.fn(() => ({ generateContent: mockGenerateContent }));
    jest.mock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      })),
    }));

    const { AIService } = await import('./aiService');
    const result = await AIService.generateAnalysis(mockReportData);

    expect(result.summary).toContain('Numerical Summary of Key Questions:');
  });

  it('should use simulation if no API key is provided', async () => {
    delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const { AIService } = await import('./aiService');
    const result = await AIService.generateAnalysis(mockReportData);

    expect(result.summary).toContain('Numerical Summary of Key Questions:');
  });
});
