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

  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    mockFetch.mockReset();
    (global as any).fetch = mockFetch;
  });

  it('should generate analysis using the API route when fetch succeeds', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ detailed: 'Detailed report', summary: 'Quick summary' }),
    });

    const { AIService } = await import('./aiService');
    const result = await AIService.generateAnalysis(mockReportData);

    expect(mockFetch).toHaveBeenCalledWith('/api/generate-summary', expect.objectContaining({
      method: 'POST',
    }));
    expect(result).toEqual({ detailed: 'Detailed report', summary: 'Quick summary' });
  });

  it('should fall back to simulation when the API returns an error response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server Error' }),
    });

    const { AIService } = await import('./aiService');
    const result = await AIService.generateAnalysis(mockReportData);

    expect(result.summary).toContain('Numerical Summary of Key Questions:');
  });

  it('should fall back to simulation when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { AIService } = await import('./aiService');
    const result = await AIService.generateAnalysis(mockReportData);

    expect(result.summary).toContain('Numerical Summary of Key Questions:');
  });
});
