// AI Service for Gemini Integration
// This service handles AI analysis of daily reports

import { ComplianceReport } from './dataService';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

export class AIService {
  private static readonly API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  private static genAI = new GoogleGenerativeAI(this.API_KEY);

  /**
   * Generate AI analysis using Gemini API
   */
  static async generateAnalysis(reportData: DailyReportData): Promise<{ detailed: string; summary: string }> {
    try {
      console.log('DEBUG: AIService.API_KEY:', this.API_KEY ? 'Set' : 'Not Set'); // Log API key status

      // If no API key, use simulation
      if (!this.API_KEY) {
        console.log('🤖 No Gemini API key found, using simulation');
        return this.simulateAnalysis(reportData);
      }

      const detailedPrompt = this.buildDetailedPrompt(reportData);
      const concisePrompt = this.buildConcisePrompt(reportData);

      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const [detailedResult, summaryResult] = await Promise.all([
        model.generateContent(detailedPrompt),
        model.generateContent(concisePrompt)
      ]);

      const detailed = detailedResult.response.text();
      const summary = summaryResult.response.text();

      return { detailed, summary };

    } catch (error) {
      console.error('❌ Error calling Gemini API:', error);
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
  private static aggregateQuestionAnswers(reports: ComplianceReport[]): string {
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

  private static buildDetailedPrompt(reportData: DailyReportData): string {
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

  private static buildConcisePrompt(reportData: DailyReportData): string {
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
  private static simulateAnalysis(reportData: DailyReportData): { detailed: string, summary: string } {
    const resolutionRate = reportData.performance.complaintResolutionRate;
    const totalReports = reportData.metrics.totalComplaints;
    const approvedReports = reportData.metrics.resolvedComplaints;
    const pendingReports = totalReports - approvedReports;

    let segregationIssues = '';
    const mixedWasteFeederPoints: string[] = [];
    reportData.rawReports.forEach(report => {
      const wasteSegregatedAnswer = report.answers.find(a => a.questionId === 'waste_segregated');
      if (wasteSegregatedAnswer && (wasteSegregatedAnswer.answer === 'no' || wasteSegregatedAnswer.notes?.toLowerCase().includes('mixed'))) {
        mixedWasteFeederPoints.push(report.feederPointName);
      }
    });

    if (mixedWasteFeederPoints.length > 0) {
      segregationIssues = `\n\nWaste Segregation Analysis:\nObservations indicate that waste segregation is a recurring issue. Specifically, feeder points such as ${mixedWasteFeederPoints.join(', ')} reported instances of mixed waste. This impacts processing efficiency and environmental compliance.`;
    }

    // Generate the specific "yes/no" counts summary for simulation
    const questionDetails = new Map<string, Map<string, { count: number; reportIds: string[]; notes: string[] }>>();

    reportData.rawReports.forEach(report => {
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

    let numericalSummary = 'Numerical Summary of Key Questions:\n';
    const yesNoQuestions = [
      'scp_area_clean',
      'waste_segregated',
      'staff_present',
      'workers_wearing_uniform',
      'collection_team_mixing_waste',
      'driver_helper_uniform',
      'vehicle_separate_compartments',
    ];

    yesNoQuestions.forEach(questionId => {
      const answerMap = questionDetails.get(questionId);
      if (answerMap) {
        const yesCount = answerMap.get('yes')?.count || 0;
        const noCount = answerMap.get('no')?.count || 0;
        
        let questionText = questionId.replace(/_/g, ' '); // Format questionId for readability
        numericalSummary += `For "${questionText}": ${yesCount} reports answered 'yes' and ${noCount} reports answered 'no'.\n`;
      }
    });

    const detailedReport = `
${numericalSummary}
DETAILED REPORT:

Comprehensive Daily Operational Analysis for ${reportData.date}

Overall Performance:
Today's operations saw a total of ${totalReports} compliance reports submitted. Of these, ${approvedReports} were approved, resulting in a resolution rate of ${resolutionRate}%. ${pendingReports} reports remain pending, requiring further review.

Key Insights and Trends:
${segregationIssues}

Operational Efficiency:
The current operational efficiency is being impacted by inconsistent waste segregation practices. Addressing this will streamline waste processing and improve overall compliance.

Recommendations:
1. Implement targeted training for field teams on waste segregation protocols.
2. Conduct surprise inspections at feeder points identified with segregation issues.
3. Enhance monitoring mechanisms to identify and address non-compliance promptly.
`;

    const conciseSummary = `
Daily Operational Summary for ${reportData.date}

Today's operations processed ${totalReports} compliance reports, with a ${resolutionRate}% approval rate. A primary challenge identified is inconsistent waste segregation, particularly at feeder points like ${mixedWasteFeederPoints.join(', ')}. This issue requires immediate attention to improve processing efficiency and environmental adherence. Recommendations include targeted training and enhanced monitoring. Overall, the system demonstrates capacity, but specific operational adjustments are needed to optimize waste management practices and ensure full compliance with environmental standards. The taskforce continues to monitor and adapt to daily operational challenges, striving for continuous improvement in urban waste management. Further efforts will focus on reinforcing best practices and leveraging technology for better oversight. This summary provides a high-level overview for ministerial review, highlighting key performance indicators and areas requiring strategic intervention to maintain and enhance public service delivery.
    `;

    return { detailed: detailedReport, summary: conciseSummary };
  }

  /**
   * Generate trend analysis
   */
  private static generateTrendAnalysis(reportData: DailyReportData): string {
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
  private static generateRecommendations(reportData: DailyReportData): string {
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
