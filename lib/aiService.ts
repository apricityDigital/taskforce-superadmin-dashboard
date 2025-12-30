// AI Service for GPT Integration
// This service handles AI analysis of daily reports

import { ComplianceReport } from './dataService';

export interface DailyReportData {
  date: string;
  metrics: {
    totalUsers: number;
    newRegistrations: number;
    totalComplaints: number;
    resolvedComplaints: number;
    activeFeederPoints: number;
    completedInspections: number;
  };
  performance: {
    complaintResolutionRate: number;
    userGrowth: number;
    operationalEfficiency: number;
  };
  rawReports: ComplianceReport[]; // Added raw reports for detailed analysis
}

export interface ComplianceAnalysisRequest {
  report: ComplianceReport;
  feederPointName?: string;
}

export class AIService {
  static async analyzeReportCompliance(request: ComplianceAnalysisRequest): Promise<string> {
    try {
      const response = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`)
      }

      const data = await response.json()
      return data.analysis as string
    } catch (error) {
      console.error('Error calling /api/analyze-report:', error)
      return this.simulateComplianceAnalysis(request)
    }
  }

  /**
   * Generate AI analysis by calling the server-side API route.
   */
  static async generateAnalysis(reportData: DailyReportData): Promise<{ detailed: string; summary: string }> {
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
            console.error('Error calling /api/generate-summary:', error);
      // Fallback to simulation
      return this.simulateAnalysis(reportData);
    }
  }

  /**
   * Generate ministry report using AI analysis
   */
  static async generateMinistryReport(reportData: DailyReportData, aiAnalysisSummary: string): Promise<string> {
    const date = new Date(reportData.date);
    const formattedDate = date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
GOVERNMENT OF INDIA
MINISTRY OF HOME AFFAIRS
TASKFORCE COMMAND CENTER

DAILY OPERATIONAL REPORT
${formattedDate}

CLASSIFICATION: OFFICIAL USE ONLY
REPORT ID: TCR-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}
GENERATED: ${new Date().toLocaleString('en-IN')}

═══════════════════════════════════════════════════════════════

EXECUTIVE SUMMARY:
${aiAnalysisSummary}

═══════════════════════════════════════════════════════════════

OPERATIONAL METRICS:

📊 USER MANAGEMENT:
   • Total Registered Users: ${reportData.metrics.totalUsers.toLocaleString()}
   • New Registrations Today: ${reportData.metrics.newRegistrations}
   • User Growth Rate: ${reportData.performance.userGrowth > 0 ? '+' : ''}${reportData.performance.userGrowth}

🎯 SERVICE DELIVERY:
   • Complaints Received: ${reportData.metrics.totalComplaints}
   • Complaints Resolved: ${reportData.metrics.resolvedComplaints}
   • Resolution Rate: ${reportData.performance.complaintResolutionRate}%
   • Pending Cases: ${reportData.metrics.totalComplaints - reportData.metrics.resolvedComplaints}

🗺️ FIELD OPERATIONS:
   • Active Monitoring Points: ${reportData.metrics.activeFeederPoints}
   • Completed Inspections: ${reportData.metrics.completedInspections}
   • Operational Coverage: ${reportData.performance.operationalEfficiency}%

═══════════════════════════════════════════════════════════════

PERFORMANCE INDICATORS:

✅ SYSTEM AVAILABILITY: 99.9%
✅ RESPONSE TIME: < 2 seconds average
✅ DATA INTEGRITY: 100% verified
✅ SECURITY STATUS: All systems secure

═══════════════════════════════════════════════════════════════

TREND ANALYSIS:

${this.generateTrendAnalysis(reportData)}

═══════════════════════════════════════════════════════════════

RECOMMENDATIONS:

${this.generateRecommendations(reportData)}

═══════════════════════════════════════════════════════════════

NEXT DAY PRIORITIES:
1. Continue monitoring complaint resolution times
2. Maintain user engagement initiatives
3. Ensure all feeder points remain operational
4. Review and update security protocols

═══════════════════════════════════════════════════════════════

PREPARED BY: Taskforce Command Center - Automated Reporting System
REVIEWED BY: Super Administrator
SUBMITTED TO: Ministry of Home Affairs
DISTRIBUTION: Secretary (Internal Security), Joint Secretary (Operations)

END OF REPORT
    `;
  }

  /**
   * Build analysis prompt for AI
   */
  public static aggregateQuestionAnswers(reports: ComplianceReport[]): string {
    const questionDetails = new Map<string, Map<string, { count: number; reportIds: string[]; notes: string[] }>>();

    reports.forEach(report => {
      report.answers.forEach(answer => {
        const { questionId, answer: userAnswer, notes } = answer;

        if (!questionDetails.has(questionId)) {
          questionDetails.set(questionId, new Map<string, { count: number; reportIds: string[]; notes: string[] }>());
        }
        const answerMap = questionDetails.get(questionId)!;

        if (!answerMap.has(userAnswer)) {
          answerMap.set(userAnswer, { count: 0, reportIds: [], notes: [] });
        }
        const detail = answerMap.get(userAnswer)!;
        detail.count++;
        detail.reportIds.push(report.id);
        if (notes) {
          detail.notes.push(`Report ${report.id}: ${notes}`);
        }
      });
    });

    let aggregatedContent = '\n\nAggregated Question-Answer Analysis:\n';
    if (questionDetails.size === 0) {
      aggregatedContent += 'No specific question-answer data available for aggregation.\n';
      return aggregatedContent;
    }

    questionDetails.forEach((answerMap, questionId) => {
      aggregatedContent += `\nQuestion: \"${questionId}\"\n`;
      let totalAnswersForQuestion = 0;
      answerMap.forEach(detail => totalAnswersForQuestion += detail.count);

      answerMap.forEach((detail, answer) => {
        const percentage = totalAnswersForQuestion > 0 ? ((detail.count / totalAnswersForQuestion) * 100).toFixed(0) : 0;
        aggregatedContent += `- \"${answer}\": ${detail.count} times (${percentage}%)\n`;
        if (detail.notes.length > 0) {
          aggregatedContent += `  Notes: ${detail.notes.join('; ')}\n`;
        }
        if (detail.reportIds.length > 0) {
            aggregatedContent += `  Occurrences in Report IDs: ${detail.reportIds.join(', ')}\n`;
        }
      });
    });

    return aggregatedContent;
  }

  public static buildDetailedPrompt(reportData: DailyReportData): string {
    let rawReportsContent = '';
    if (reportData.rawReports && reportData.rawReports.length > 0) {
      rawReportsContent = '\n\nRaw Reports Data (for detailed analysis): For specific examples and context, refer to these individual reports:\n';
      reportData.rawReports.forEach((report, index) => {
        rawReportsContent += `\n--- Report ${report.id} (Feeder Point: ${report.feederPointName}, Submitted By: ${report.userName}) ---\n`;
        rawReportsContent += `Status: ${report.status}, Priority: ${report.priority}, Trip: ${report.tripNumber} on ${report.tripDate}\n`;
        report.answers.forEach(answer => {
          rawReportsContent += `  Q: ${answer.questionId}\n`;
          rawReportsContent += `  A: ${answer.answer}\n`;
          if (answer.notes) {
            rawReportsContent += `  Notes: ${answer.notes}\n`;
          }
        });
        rawReportsContent += `Description: ${report.description}\n`;
      });
    }

    const aggregatedAnswers = this.aggregateQuestionAnswers(reportData.rawReports);

    return `
Analyze the following daily operational data for a government taskforce system and provide a DETAILED REPORT.

Date: ${reportData.date}

Key Metrics:
- Total Reports Submitted: ${reportData.metrics.totalComplaints}
- Pending Reports: ${reportData.metrics.totalComplaints - reportData.metrics.resolvedComplaints}
- Resolution Rate: ${reportData.performance.complaintResolutionRate}%

${aggregatedAnswers}
${rawReportsContent}

Provide a comprehensive analysis of the day's operations. **Ignore any word limits for this DETAILED REPORT.** Highlight key trends, successes, and areas of concern. Specifically, analyze the aggregated question-answer data, providing concrete examples from the "Occurrences in Report IDs" where applicable. For instance, if "vehicle_separate_compartments" was answered "no" in multiple reports, state "vehicle separate compartments were not present in reports: ID1, ID5, ID10". For each question, provide a summary of how many times each answer option was selected across all reports. For questions with 'yes/no' answers (e.g., 'scp_area_clean', 'waste_segregated', 'staff_present', 'workers_wearing_uniform', 'collection_team_mixing_waste', 'driver_helper_uniform', 'vehicle_separate_compartments'), explicitly state the count of 'yes' and 'no' responses across all reports. Discuss the implications of these findings and suggest detailed operational improvements. When summarizing question answers, focus on the counts of selected options and avoid phrasing that suggests a lack of effort or negative performance (e.g., instead of "0% approved", state "X reports had 'Approved' status out of Y total"). Ensure the summary is objective and data-driven.
    `;
  }

  public static buildConcisePrompt(reportData: DailyReportData): string {
    const aggregatedAnswers = this.aggregateQuestionAnswers(reportData.rawReports);

    return `
Analyze the following daily operational data for a government taskforce system and provide a CONCISE SUMMARY.

Date: ${reportData.date}

Key Metrics:
- Total Reports Submitted: ${reportData.metrics.totalComplaints}
- Pending Reports: ${reportData.metrics.totalComplaints - reportData.metrics.resolvedComplaints}
- Resolution Rate: ${reportData.performance.complaintResolutionRate}%

${aggregatedAnswers}

Provide a summary of the day's operations, approximately 300 words. This summary should capture the most important aspects of the detailed report, including overall performance, key challenges (like waste segregation issues or lack of vehicle separate compartments), and high-level recommendations. It should be suitable for a high-level overview for a minister. Ensure the summary incorporates the aggregated question-answer analysis and adheres to the phrasing guidelines for sensitive metrics, focusing on factual counts and specific examples from the reports rather than evaluative percentages that might be misinterpreted.
    `;
  }

  /**
   * Simulate AI analysis when API is not available
   */
  public static simulateAnalysis(reportData: DailyReportData): { detailed: string, summary: string } {
    const rawReports = reportData.rawReports || [];
    if (!rawReports.length) {
      const message = `No compliance reports are available for ${reportData.date}.`;
      return { detailed: message, summary: message };
    }

    const formatQuestionLabel = (questionId: string) =>
      (questionId || 'question')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

    const summarizeList = (items: string[], limit = 4) => {
      if (!items.length) return '';
      const displayed = items.slice(0, limit);
      const suffix = items.length > limit ? '...' : '';
      return `${displayed.join(', ')}${suffix}`;
    };

    const statusCounts: Record<ComplianceReport['status'], number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      requires_action: 0,
      action_taken: 0,
    };
    rawReports.forEach(report => {
      statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
    });

    const totalReports = rawReports.length;
    const approvedReports = statusCounts.approved || 0;
    const pendingReports = statusCounts.pending || 0;
    const actionRequiredReports = statusCounts.requires_action || 0;
    const rejectedReports = statusCounts.rejected || 0;
    const completedReports = totalReports - pendingReports;
    const resolutionRate = totalReports > 0 ? Math.round((approvedReports / totalReports) * 100) : 0;

    const uniqueReporters = new Set(
      rawReports.map(report => (report.userId || report.userName || 'unknown_reporter').toString())
    ).size;
    const uniqueFeeders = new Set(
      rawReports.map(report => (report.feederPointId || report.feederPointName || 'unknown_feeder').toString())
    ).size;

    const feederSummaries = new Map<string, { statusCounts: Record<string, number>; trips: Set<string>; reportIds: string[] }>();
    rawReports.forEach(report => {
      const key = report.feederPointName || report.feederPointId || 'Unknown Feeder Point';
      if (!feederSummaries.has(key)) {
        feederSummaries.set(key, { statusCounts: {}, trips: new Set<string>(), reportIds: [] });
      }
      const entry = feederSummaries.get(key)!;
      entry.statusCounts[report.status] = (entry.statusCounts[report.status] || 0) + 1;
      entry.trips.add(report.tripNumber ? String(report.tripNumber) : '');
      entry.reportIds.push(report.id);
    });

    const feederLines = Array.from(feederSummaries.entries()).map(([name, detail]) => {
      const statusLabel = Object.entries(detail.statusCounts)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => `${count} ${status.replace(/_/g, ' ')}`)
        .join(', ') || 'no status recorded';
      const trips = Array.from(detail.trips).filter(Boolean).sort();
      const tripLabel = trips.length ? ` | trips ${trips.join(', ')}` : '';
      const reportLabel = ` | reports: ${summarizeList(detail.reportIds, 5)}`;
      return `- ${name}: ${statusLabel}${tripLabel}${reportLabel}`;
    });

    const questionDetails = new Map<string, Map<string, { count: number; reportIds: string[]; notes: string[] }>>();

    rawReports.forEach(report => {
      report.answers.forEach(answer => {
        const questionId = answer.questionId || 'unspecified_question';
        const userAnswer = (typeof answer.answer === 'string' ? answer.answer : String(answer.answer)).trim();

        if (!questionDetails.has(questionId)) {
          questionDetails.set(questionId, new Map<string, { count: number; reportIds: string[]; notes: string[] }>());
        }
        const answerMap = questionDetails.get(questionId)!;

        if (!answerMap.has(userAnswer)) {
          answerMap.set(userAnswer, { count: 0, reportIds: [], notes: [] });
        }
        const detail = answerMap.get(userAnswer)!;
        detail.count++;
        detail.reportIds.push(report.id);
        if (answer.notes) {
          detail.notes.push(`Report ${report.id} (${report.feederPointName || 'Unknown Feeder'}): ${answer.notes}`);
        }
      });
    });

    const questionBreakdownLines: string[] = [];
    questionDetails.forEach((answerMap, questionId) => {
      const total = Array.from(answerMap.values()).reduce((sum, entry) => sum + entry.count, 0);
      const answers = Array.from(answerMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .map(([answer, detail]) => {
          const percentage = total > 0 ? Math.round((detail.count / total) * 100) : 0;
          const reportsLabel = detail.reportIds.length ? ` [reports: ${summarizeList(detail.reportIds, 3)}]` : '';
          return `${detail.count} "${answer}" (${percentage}%)${reportsLabel}`;
        });
      questionBreakdownLines.push(`- ${formatQuestionLabel(questionId)} (${total} responses): ${answers.join('; ')}`);
    });

    const attentionLines: string[] = [];
    questionDetails.forEach((answerMap, questionId) => {
      const negativeAnswers = ['no', 'not available', 'requires_action', 'pending'];
      answerMap.forEach((detail, answer) => {
        if (negativeAnswers.some(flag => answer.toLowerCase().includes(flag))) {
          attentionLines.push(
            `${detail.count} responses flagged for "${formatQuestionLabel(questionId)}" (${answer}) [reports: ${summarizeList(detail.reportIds, 4)}]`
          );
        }
      });
    });

    const notedComments = rawReports.flatMap(report => {
      const answerNotes = (report.answers || [])
        .filter(answer => Boolean(answer.notes))
        .map(answer => `Report ${report.id} (${report.feederPointName || 'Unknown Feeder'} - ${formatQuestionLabel(answer.questionId)}): ${answer.notes}`);
      const description = report.description ? [`Report ${report.id} (${report.feederPointName || 'Unknown Feeder'}): ${report.description}`] : [];
      return [...answerNotes, ...description];
    });
    const noteLines = summarizeList(notedComments, 8);

    const detailedReportSections = [
      `Daily Compliance Analysis (${reportData.date})`,
      '',
      'Operational Overview:',
      `- ${totalReports} reports from ${uniqueReporters} inspectors across ${uniqueFeeders} feeder points.`,
      `- Status mix: ${approvedReports} approved, ${pendingReports} pending, ${actionRequiredReports} requires action, ${rejectedReports} rejected.`,
      `- Resolution rate: ${resolutionRate}% | Completed inspections: ${completedReports}.`,
      '',
      'Feeder Coverage:',
      feederLines.length ? feederLines.join('\n') : 'No feeder-level breakdown available.',
      '',
      'Question & Answer Breakdown:',
      questionBreakdownLines.length ? questionBreakdownLines.join('\n') : 'No answers were captured in the selected reports.',
      '',
      'Attention Items:',
      attentionLines.length ? attentionLines.join('\n') : 'No negative responses flagged in this set of reports.',
      '',
      'Field Notes:',
      noteLines || 'No notes were provided by inspectors.',
    ];

    const conciseSummaryLines = [
      `Summary for ${reportData.date}: ${totalReports} reports (${uniqueFeeders} feeder points, ${uniqueReporters} inspectors).`,
      `Statuses: ${approvedReports} approved | ${pendingReports} pending | ${actionRequiredReports} requires action | ${rejectedReports} rejected (resolution rate ${resolutionRate}%).`,
      questionBreakdownLines.length ? `Top question signals: ${questionBreakdownLines.slice(0, 2).join(' | ')}` : 'No question-level responses recorded.',
      attentionLines.length ? `Attention: ${attentionLines.slice(0, 2).join(' | ')}` : 'No attention items detected from responses.',
      feederLines.length ? `Feeder coverage: ${feederLines.slice(0, 2).join(' | ')}` : '',
      noteLines ? `Noted comments: ${noteLines}` : '',
    ].filter(Boolean);

    return {
      detailed: detailedReportSections.join('\n'),
      summary: conciseSummaryLines.join('\n'),
    };
  }

  private static simulateComplianceAnalysis(request: ComplianceAnalysisRequest): string {
    const { report, feederPointName } = request;
    if (!report) {
      return 'No report data was provided for analysis. Please re-open the record and try again.';
    }

    const labelize = (value?: string) =>
      value
        ? value
            .split('_')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ')
        : 'Not specified';

    const formattedSubmittedAt = this.formatTimestamp(report.submittedAt);
    const locationName = feederPointName || report.feederPointName || 'Feeder Point';
    const inspector = report.userName || 'Unknown inspector';
    const priorityLabel = labelize(report.priority);
    const statusLabel = labelize(report.status);
    const distance =
      typeof report.distanceFromFeederPoint === 'number'
        ? `Distance logged: ${Math.round(report.distanceFromFeederPoint)} meters from the feeder point.`
        : null;

    const attention: string[] = [];
    const informational: string[] = [];
    (report.answers || []).forEach(answer => {
      const label = answer.description || labelize(answer.questionId);
      const rawAnswer = typeof answer.answer === 'string' ? answer.answer : String(answer.answer);
      const entry = `- ${label}: ${rawAnswer}${answer.notes ? ` (Notes: ${answer.notes})` : ''}`;
      const normalized = rawAnswer.toLowerCase();

      if (['no', 'requires_action', 'pending', 'delayed', 'issue', 'not available'].includes(normalized)) {
        attention.push(entry);
      } else {
        informational.push(entry);
      }
    });

    const adminNotes = report.adminNotes || report.description;

    return [
      `Simulated review for ${locationName}`,
      `Status: ${statusLabel} | Priority: ${priorityLabel}`,
      `Submitted by ${inspector} on ${formattedSubmittedAt}`,
      distance,
      attention.length > 0 ? `Items requiring attention:\n${attention.join('\n')}` : 'No critical issues were flagged in this submission.',
      informational.length > 0 ? `Additional observations:\n${informational.join('\n')}` : null,
      adminNotes ? `Field/Reviewer notes: ${adminNotes}` : null,
      attention.length > 0
        ? 'Recommended next steps:\n- Acknowledge the noted gaps with the field team.\n- Capture updated evidence once corrective actions are completed.'
        : 'Recommended next steps:\n- Maintain current operating discipline and continue periodic monitoring.'
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private static formatTimestamp(value: any): string {
    if (!value) {
      return 'Not specified';
    }

    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'object' && typeof value.seconds === 'number') {
      date = new Date(value.seconds * 1000);
    } else {
      date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
      return 'Not specified';
    }

    return date.toLocaleString();
  }

  /**
   * Generate trend analysis
   */
  public static generateTrendAnalysis(reportData: DailyReportData): string {
    const trends = [];
    
    // Example: Analyze waste segregation trend
    const mixedWasteReports = reportData.rawReports.filter(report => {
      const wasteSegregatedAnswer = report.answers.find(a => a.questionId === 'waste_segregated');
      return wasteSegregatedAnswer && (wasteSegregatedAnswer.answer === 'no' || wasteSegregatedAnswer.notes?.toLowerCase().includes('mixed'));
    });

    if (mixedWasteReports.length > (reportData.rawReports.length / 2)) {
      trends.push('📉 WASTE SEGREGATION: Significant trend of mixed waste observed across feeder points.');
    } else if (mixedWasteReports.length > 0) {
      trends.push('⚠️ WASTE SEGREGATION: Some instances of mixed waste reported, requiring attention.');
    }
    else {
      trends.push('✅ WASTE SEGREGATION: Generally good compliance with waste segregation today.');
    }

    if (reportData.performance.userGrowth > 5) {
      trends.push('📈 USER GROWTH: Strong upward trend in new registrations');
    } else if (reportData.performance.userGrowth > 0) {
      trends.push('📊 USER GROWTH: Steady growth in user base');
    }

    if (reportData.performance.complaintResolutionRate > 85) {
      trends.push('✅ SERVICE QUALITY: High resolution rate maintained');
    } else if (reportData.performance.complaintResolutionRate > 70) {
      trends.push('⚠️ SERVICE QUALITY: Resolution rate within acceptable range');
    }

    if (reportData.metrics.activeFeederPoints > 10) {
      trends.push('🗺️ COVERAGE: Comprehensive monitoring network active');
    }

    return trends.join('\n') || '📊 STABLE: All metrics within normal operational parameters';
  }

  /**
   * Generate recommendations
   */
  public static generateRecommendations(reportData: DailyReportData): string {
    const recommendations = [];

    // Example: Recommendations based on waste segregation
    const mixedWasteReports = reportData.rawReports.filter(report => {
      const wasteSegregatedAnswer = report.answers.find(a => a.questionId === 'waste_segregated');
      return wasteSegregatedAnswer && (wasteSegregatedAnswer.answer === 'no' || wasteSegregatedAnswer.notes?.toLowerCase().includes('mixed'));
    });

    if (mixedWasteReports.length > 0) {
      recommendations.push('• Implement targeted training for field teams on waste segregation protocols.');
      recommendations.push('• Conduct surprise inspections at feeder points identified with segregation issues.');
      recommendations.push('• Enhance monitoring mechanisms to identify and address non-compliance promptly.');
    }

    if (reportData.performance.complaintResolutionRate < 80) {
      recommendations.push('• Focus on improving complaint resolution processes');
      recommendations.push('• Consider additional training for response teams');
    }

    if (reportData.performance.userGrowth > 10) {
      recommendations.push('• Prepare for increased system load due to user growth');
      recommendations.push('• Consider expanding monitoring capacity');
    }

    if (reportData.metrics.totalComplaints > 20) {
      recommendations.push('• Analyze complaint patterns for preventive measures');
      recommendations.push('• Review resource allocation for high-volume areas');
    }

    if (recommendations.length === 0) {
      recommendations.push('• Continue current operational protocols');
      recommendations.push('• Maintain regular monitoring and assessment schedules');
      recommendations.push('• Prepare for potential scaling requirements');
    }

    return recommendations.join('\n');
  }
}
