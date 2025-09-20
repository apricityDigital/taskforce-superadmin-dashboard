import { useEffect, useState } from 'react'
import { 
  FileText, 
  Send, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bot,
  Sparkles,
  Eye,
  X,
  MapPin,
  User,
  Trash2
} from 'lucide-react'
import { DataService, ComplianceReport } from '@/lib/dataService'
import { AIService, DailyReportData } from '@/lib/aiService'
import { useAuth } from '@/contexts/AuthContext'

interface ReportSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  actionRequired: number;
}

export default function DailyReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<ComplianceReport[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<ComplianceReport['status'] | 'all'>('all') // 'all', 'pending', 'approved', 'rejected', 'requires_action'
  const [generatingAI, setGeneratingAI] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null)
  const [dailyAiDetailedAnalysis, setDailyAiDetailedAnalysis] = useState<string | null>(null)
  const [dailyAiSummary, setDailyAiSummary] = useState<string | null>(null)
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<'detailed' | 'summary' | null>(null)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = DataService.onComplianceReportsChange(allReports => {
      console.log("All Compliance Reports (real-time):", allReports)
      let filteredReports = allReports.filter(report => {
        const reportDate = new Date(report.submittedAt.toDate()).toISOString().split('T')[0]
        return reportDate === selectedDate
      })

      // Apply status filter
      if (filterStatus !== 'all') {
        filteredReports = filteredReports.filter(report => report.status === filterStatus)
      }

      console.log("Filtered Compliance Reports (real-time):", filteredReports)
      setReports(filteredReports)

      // Calculate summary
      const summary: ReportSummary = {
        total: filteredReports.length,
        pending: filteredReports.filter(r => r.status === 'pending').length,
        approved: filteredReports.filter(r => r.status === 'approved').length,
        rejected: filteredReports.filter(r => r.status === 'rejected').length,
        actionRequired: filteredReports.filter(r => r.status === 'requires_action').length,
      }
      setReportSummary(summary)

      setLoading(false)
    })

    return () => unsubscribe()
  }, [selectedDate, filterStatus]) // Add filterStatus to dependency array

  const handleUpdateStatus = async (status: ComplianceReport['status']) => {
    if (!selectedReport || !user) return

    setUpdatingStatus(true)
    try {
      await DataService.updateComplianceReportStatus(
        selectedReport.id,
        status,
        adminNotes,
        user.name
      )

      alert(`Report ${status} successfully`)
      setSelectedReport(null) // Close modal
      setAdminNotes('')
    } catch (error) {
      console.error('❌ Error updating report status:', error)
      alert('Failed to update report status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const generateDailyAIAnalysis = async (type: 'detailed' | 'summary') => {
    if (!reportSummary) return

    setGeneratingAI(true)
    setSelectedAnalysisType(type)
    try {
      const reportData: DailyReportData = {
        date: selectedDate,
        metrics: {
          totalUsers: 0, // This data is not available from compliance reports
          newRegistrations: 0, // This data is not available from compliance reports
          totalComplaints: reportSummary.total,
          resolvedComplaints: reportSummary.approved,
          activeFeederPoints: 0, // This data is not available from compliance reports
          completedInspections: reportSummary.approved, // Assuming approved reports are completed inspections
        },
        performance: {
          complaintResolutionRate: reportSummary.total > 0 
            ? Math.round((reportSummary.approved / reportSummary.total) * 100)
            : 0,
          userGrowth: 0, // Not available
          operationalEfficiency: 0, // Not available
        },
        rawReports: reports // Pass the raw reports for detailed analysis
      }

      const { detailed, summary } = await AIService.generateAnalysis(reportData)
      
      if (type === 'detailed') {
        setDailyAiDetailedAnalysis(detailed)
        setDailyAiSummary(null) // Clear summary if detailed is requested
      } else {
        setDailyAiSummary(summary)
        setDailyAiDetailedAnalysis(null) // Clear detailed if summary is requested
      }
      
      alert('🤖 Daily AI Analysis completed successfully!')

    } catch (error) {
      console.error('Error generating daily AI analysis:', error)
      alert('❌ Error generating daily AI analysis. Please try again.')
    } finally {
      setGeneratingAI(false)
    }
  }

  const getStatusColor = (status: ComplianceReport['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'requires_action': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ComplianceReport['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected': return <X className="h-5 w-5 text-red-600" />;
      case 'requires_action': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 scrollable-content">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Daily Reports</h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">
                View daily reports from the field.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="relative"> {/* Added wrapper div */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ComplianceReport['status'] | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Reports</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="requires_action">Action Required</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Report Summary */}
      {reportSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-700">Total Reports</h3>
            <p className="text-3xl font-bold text-blue-600">{reportSummary.total}</p>
          </div>
          <div className="card p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-700">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{reportSummary.pending}</p>
          </div>
          <div className="card p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-700">Approved</h3>
            <p className="text-3xl font-bold text-green-600">{reportSummary.approved}</p>
          </div>
          <div className="card p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-700">Rejected</h3>
            <p className="text-3xl font-bold text-red-600">{reportSummary.rejected}</p>
          </div>
        </div>
      )}

      {/* Daily AI Analysis */}
      <div className="grid grid-cols-1 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily AI Analysis</h3>
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => generateDailyAIAnalysis('detailed')}
              disabled={generatingAI || !reportSummary || reportSummary.total === 0}
              className="flex-1 btn-secondary flex items-center justify-center space-x-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>{generatingAI && selectedAnalysisType === 'detailed' ? 'Analyzing...' : 'Generate Detailed AI Analysis'}</span>
            </button>
            <button
              onClick={() => generateDailyAIAnalysis('summary')}
              disabled={generatingAI || !reportSummary || reportSummary.total === 0}
              className="flex-1 btn-secondary flex items-center justify-center space-x-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>{generatingAI && selectedAnalysisType === 'summary' ? 'Analyzing...' : 'Generate Concise AI Summary'}</span>
            </button>
          </div>
          {dailyAiDetailedAnalysis && selectedAnalysisType === 'detailed' && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-md font-semibold text-gray-900 mb-2">Detailed Report:</h4>
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {dailyAiDetailedAnalysis}
              </pre>
              <button
                onClick={() => {
                  if (dailyAiDetailedAnalysis) {
                    const blob = new Blob([dailyAiDetailedAnalysis], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Daily_AI_Detailed_Analysis_${selectedDate}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }
                }}
                className="w-full btn-secondary flex items-center justify-center space-x-2 mt-4"
              >
                <Download className="h-4 w-4" />
                <span>Download Detailed AI Report</span>
              </button>
            </div>
          )}
          {dailyAiSummary && selectedAnalysisType === 'summary' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-900 mb-2">Concise Summary:</h4>
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {dailyAiSummary}
              </pre>
              <button
                onClick={() => {
                  if (dailyAiSummary) {
                    const blob = new Blob([dailyAiSummary], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Daily_AI_Concise_Summary_${selectedDate}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }
                }}
                className="w-full btn-secondary flex items-center justify-center space-x-2 mt-4"
              >
                <Download className="h-4 w-4" />
                <span>Download Concise AI Summary</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length > 0 ? (
          reports.map(report => (
            <div key={report.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{report.feederPointName} - Trip {report.tripNumber}</h3>
                    <p className="text-sm text-gray-600">Submitted by {report.userName} ({report.teamName})</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-500">
                        {new Date(report.submittedAt.toDate()).toLocaleDateString()}
                    </div>
                    <button onClick={() => setSelectedReport(report)} className="btn-secondary p-2">
                        <Eye className="h-5 w-5" />
                    </button>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-700">{report.description}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-600 mb-6">
              No reports were found for the selected date.
            </p>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedReport.feederPointName} - Trip {selectedReport.tripNumber}</h2>
              <button onClick={() => setSelectedReport(null)} className="p-2">
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Details</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        <p><strong>Submitted By:</strong> {selectedReport.userName} ({selectedReport.teamName})</p>
                        <p><strong>Feeder Point:</strong> {selectedReport.feederPointName}</p>
                        <p><strong>Submitted At:</strong> {new Date(selectedReport.submittedAt.toDate()).toLocaleString()}</p>
                        <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedReport.status)}`}>{selectedReport.status}</span></p>
                        <p><strong>Priority:</strong> <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            selectedReport.priority === 'high' ? 'bg-red-100 text-red-800' :
                            selectedReport.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                        }`}>{selectedReport.priority}</span></p>
                        <p><strong>Trip Date:</strong> {selectedReport.tripDate}</p>
                        <p><strong>Trip Number:</strong> {selectedReport.tripNumber}</p>
                        <p><strong>Location:</strong> {selectedReport.submittedLocation.address} ({selectedReport.distanceFromFeederPoint.toFixed(2)}m from FP)</p>
                    </div>
                </div>
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-sm text-gray-700">{selectedReport.description}</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Answers</h3>
                    <div className="space-y-2">
                        {selectedReport.answers.map((answer, index) => (
                            <div key={index} className="p-2 bg-gray-50 rounded-md">
                                <p className="text-sm font-medium">Q: {answer.questionId}</p>
                                <p className="text-sm">A: {answer.answer}</p>
                                {answer.notes && <p className="text-xs text-gray-600">Notes: {answer.notes}</p>}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Attachments</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {selectedReport.attachments && selectedReport.attachments.length > 0 ? (
                            selectedReport.attachments.map(att => (
                                <div key={att.id} className="relative">
                                    <img src={att.url} alt={att.filename} className="w-full h-32 object-cover rounded-lg" />
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">No attachments found.</p>
                        )}
                    </div>
                </div>
              </div>
              <div>
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Notes</h3>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    rows={4}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes for this report..."
                  ></textarea>
                </div>
                <div className="card mt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpdateStatus('approved')}
                          disabled={updatingStatus}
                          className="w-full btn-primary flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>{updatingStatus ? 'Approving...' : 'Approve'}</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus('rejected')}
                          disabled={updatingStatus}
                          className="w-full btn-secondary flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white"
                        >
                          <X className="h-4 w-4" />
                          <span>{updatingStatus ? 'Rejecting...' : 'Reject'}</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus('requires_action')}
                          disabled={updatingStatus}
                          className="w-full btn-secondary flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          <span>{updatingStatus ? 'Updating...' : 'Action Required'}</span>
                        </button>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}