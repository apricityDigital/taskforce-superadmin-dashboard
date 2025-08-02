import { useEffect, useState } from 'react'
import { 
  FileText, 
  Send, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Bot,
  Sparkles,
  Share2
} from 'lucide-react'
import { DataService } from '@/lib/dataService'
import { AIService, DailyReportData } from '@/lib/aiService'

interface DailyReport {
  date: string
  totalUsers: number
  newRegistrations: number
  totalComplaints: number
  resolvedComplaints: number
  activeFeederPoints: number
  completedInspections: number
  summary: string
  aiAnalysis?: string
  ministryReport?: string
}

export default function DailyReportsPage() {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currentReport, setCurrentReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [sendingToMinistry, setSendingToMinistry] = useState(false)

  useEffect(() => {
    loadDailyReports()
  }, [])

  const loadDailyReports = async () => {
    setLoading(true)
    try {
      // Load existing reports (you can store these in Firebase)
      // For now, we'll generate today's report
      await generateTodaysReport()
    } catch (error) {
      console.error('Error loading daily reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateTodaysReport = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Collect all data for today
      const [users, complaints, feederPoints] = await Promise.all([
        DataService.getAllUsers(),
        DataService.getAllComplaints(),
        DataService.getAllFeederPoints()
      ])

      // Filter today's data
      const todayComplaints = complaints.filter(complaint => {
        const complaintDate = complaint.createdAt?.toDate?.()?.toISOString().split('T')[0]
        return complaintDate === today
      })

      const todayUsers = users.filter(user => {
        const userDate = user.createdAt?.toDate?.()?.toISOString().split('T')[0]
        return userDate === today
      })

      const resolvedComplaints = todayComplaints.filter(c => c.status === 'resolved')
      const activeFeederPoints = feederPoints.filter(fp => fp.status === 'active')

      const report: DailyReport = {
        date: today,
        totalUsers: users.length,
        newRegistrations: todayUsers.length,
        totalComplaints: todayComplaints.length,
        resolvedComplaints: resolvedComplaints.length,
        activeFeederPoints: activeFeederPoints.length,
        completedInspections: 0, // You can add inspection data
        summary: `Daily operations summary for ${new Date().toLocaleDateString()}`
      }

      setCurrentReport(report)
      setReports([report, ...reports])
    } catch (error) {
      console.error('Error generating today\'s report:', error)
    }
  }

  const generateAIAnalysis = async () => {
    if (!currentReport) return

    setGeneratingAI(true)
    try {
      // Prepare data for AI analysis
      const reportData: DailyReportData = {
        date: currentReport.date,
        metrics: {
          totalUsers: currentReport.totalUsers,
          newRegistrations: currentReport.newRegistrations,
          totalComplaints: currentReport.totalComplaints,
          resolvedComplaints: currentReport.resolvedComplaints,
          activeFeederPoints: currentReport.activeFeederPoints,
          completedInspections: currentReport.completedInspections
        },
        performance: {
          complaintResolutionRate: currentReport.totalComplaints > 0
            ? Math.round((currentReport.resolvedComplaints / currentReport.totalComplaints) * 100)
            : 0,
          userGrowth: currentReport.newRegistrations,
          operationalEfficiency: Math.round((currentReport.activeFeederPoints / (currentReport.activeFeederPoints + 1)) * 100)
        }
      }

      // Use AI Service for analysis
      const aiAnalysis = await AIService.generateAnalysis(reportData)

      const updatedReport = {
        ...currentReport,
        aiAnalysis
      }

      setCurrentReport(updatedReport)
      alert('🤖 AI Analysis completed successfully!')

    } catch (error) {
      console.error('Error generating AI analysis:', error)
      alert('❌ Error generating AI analysis. Please try again.')
    } finally {
      setGeneratingAI(false)
    }
  }

  const generateMinistryReport = async () => {
    if (!currentReport || !currentReport.aiAnalysis) {
      alert('⚠️ Please generate AI analysis first')
      return
    }

    setSendingToMinistry(true)
    try {
      // Prepare data for ministry report
      const reportData: DailyReportData = {
        date: currentReport.date,
        metrics: {
          totalUsers: currentReport.totalUsers,
          newRegistrations: currentReport.newRegistrations,
          totalComplaints: currentReport.totalComplaints,
          resolvedComplaints: currentReport.resolvedComplaints,
          activeFeederPoints: currentReport.activeFeederPoints,
          completedInspections: currentReport.completedInspections
        },
        performance: {
          complaintResolutionRate: currentReport.totalComplaints > 0
            ? Math.round((currentReport.resolvedComplaints / currentReport.totalComplaints) * 100)
            : 0,
          userGrowth: currentReport.newRegistrations,
          operationalEfficiency: Math.round((currentReport.activeFeederPoints / (currentReport.activeFeederPoints + 1)) * 100)
        }
      }

      // Generate formal ministry report using AI Service
      const ministryReport = await AIService.generateMinistryReport(reportData, currentReport.aiAnalysis)

      const updatedReport = {
        ...currentReport,
        ministryReport
      }

      setCurrentReport(updatedReport)
      alert('📄 Ministry report generated successfully!')

    } catch (error) {
      console.error('Error generating ministry report:', error)
      alert('❌ Error generating ministry report. Please try again.')
    } finally {
      setSendingToMinistry(false)
    }
  }



  const downloadReport = () => {
    if (!currentReport?.ministryReport) return
    
    const blob = new Blob([currentReport.ministryReport], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Daily_Report_${currentReport.date}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
                AI-powered daily analysis and ministry reporting
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
            <button
              onClick={generateTodaysReport}
              className="btn-primary flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Current Report Dashboard */}
      {currentReport && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metrics Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Metrics */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
                Daily Metrics - {new Date(currentReport.date).toLocaleDateString()}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Total Users</p>
                      <p className="text-2xl font-bold text-blue-900">{currentReport.totalUsers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">New Users</p>
                      <p className="text-2xl font-bold text-green-900">{currentReport.newRegistrations}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600">Complaints</p>
                      <p className="text-2xl font-bold text-yellow-900">{currentReport.totalComplaints}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">Resolved</p>
                      <p className="text-2xl font-bold text-purple-900">{currentReport.resolvedComplaints}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <MapPin className="h-8 w-8 text-indigo-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-indigo-600">Active Points</p>
                      <p className="text-2xl font-bold text-indigo-900">{currentReport.activeFeederPoints}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-teal-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-teal-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-teal-600">Inspections</p>
                      <p className="text-2xl font-bold text-teal-900">{currentReport.completedInspections}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Analysis Section */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Bot className="h-6 w-6 mr-2 text-purple-600" />
                  AI Analysis
                </h2>
                <button
                  onClick={generateAIAnalysis}
                  disabled={generatingAI}
                  className="btn-primary flex items-center space-x-2"
                >
                  {generatingAI ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate AI Analysis</span>
                    </>
                  )}
                </button>
              </div>

              {currentReport.aiAnalysis ? (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {currentReport.aiAnalysis}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>Click "Generate AI Analysis" to get intelligent insights about today's operations</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions Panel */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={generateAIAnalysis}
                  disabled={generatingAI}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>AI Analysis</span>
                </button>

                <button
                  onClick={generateMinistryReport}
                  disabled={sendingToMinistry || !currentReport?.aiAnalysis}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  {sendingToMinistry ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      <span>Ministry Report</span>
                    </>
                  )}
                </button>

                <button
                  onClick={downloadReport}
                  disabled={!currentReport?.ministryReport}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Report</span>
                </button>
              </div>
            </div>

            {/* Report Status */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Data Collection</span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">AI Analysis</span>
                  {currentReport.aiAnalysis ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ministry Report</span>
                  {currentReport.ministryReport ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ministry Report Preview */}
      {currentReport?.ministryReport && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-green-600" />
              Ministry Report Preview
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={downloadReport}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(currentReport.ministryReport || '')}
                className="btn-primary flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Copy to Clipboard</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
              {currentReport.ministryReport}
            </pre>
          </div>
        </div>
      )}

      {/* No Report State */}
      {!currentReport && (
        <div className="card text-center py-12">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Generated</h3>
          <p className="text-gray-600 mb-6">
            Generate today's report to start the AI analysis and ministry reporting process
          </p>
          <button
            onClick={generateTodaysReport}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Calendar className="h-4 w-4" />
            <span>Generate Today's Report</span>
          </button>
        </div>
      )}
    </div>
  )
}
