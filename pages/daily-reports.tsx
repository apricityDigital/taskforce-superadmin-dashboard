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
  Trash2,
  Image as ImageIcon,
  ZoomIn,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Maximize2
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: string]: boolean }>({})
  const [imageErrorStates, setImageErrorStates] = useState<{ [key: string]: boolean }>({})
  const [showCollage, setShowCollage] = useState(false)
  const [allImages, setAllImages] = useState<Array<{ url: string, title: string, type: 'answer' | 'attachment' }>>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (selectedReport) {
      setImageLoadingStates({})
      setImageErrorStates({})
      return
    }

    setSelectedImage(null)
    setShowCollage(false)
    setAllImages([])
    setCurrentImageIndex(0)
    setImageLoadingStates({})
    setImageErrorStates({})
  }, [selectedReport])

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

  // Keyboard navigation for image modal
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!selectedImage) return

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          navigateImage('prev')
          break
        case 'ArrowRight':
          event.preventDefault()
          navigateImage('next')
          break
        case 'Escape':
          event.preventDefault()
          closeImageModal()
          break
        case 'g':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            openCollage()
          }
          break
      }
    }

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyPress)
      return () => document.removeEventListener('keydown', handleKeyPress)
    }
  }, [selectedImage, allImages, currentImageIndex])

  // Image handling functions
  const handleImageLoad = (imageUrl: string) => {
    setImageLoadingStates(prev => ({ ...prev, [imageUrl]: false }))
  }

  const handleImageError = (imageUrl: string) => {
    setImageLoadingStates(prev => ({ ...prev, [imageUrl]: false }))
    setImageErrorStates(prev => ({ ...prev, [imageUrl]: true }))
  }

  const openImageModal = (imageUrl: string) => {
    // Collect all images from the current report
    if (selectedReport) {
      const images: Array<{ url: string, title: string, type: 'answer' | 'attachment' }> = []

      // Add images from answers
      selectedReport.answers.forEach((answer, answerIndex) => {
        if (answer.photos) {
          answer.photos.forEach((photoUrl, photoIndex) => {
            images.push({
              url: photoUrl,
              title: `Question ${answer.questionId} - Photo ${photoIndex + 1}`,
              type: 'answer'
            })
          })
        }
      })

      // Add images from attachments
      if (selectedReport.attachments) {
        selectedReport.attachments.forEach((attachment) => {
          if (attachment.type === 'photo') {
            images.push({
              url: attachment.url,
              title: attachment.filename,
              type: 'attachment'
            })
          }
        })
      }

      setAllImages(images)
      const currentIndex = images.findIndex(img => img.url === imageUrl)
      setCurrentImageIndex(currentIndex >= 0 ? currentIndex : 0)
    }

    setImageErrorStates(prev => {
      const updated = { ...prev }
      delete updated[imageUrl]
      return updated
    })

    setImageLoadingStates(prev => ({ ...prev, [imageUrl]: true }))
    setSelectedImage(imageUrl)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
    setShowCollage(false)
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    if (allImages.length === 0) return

    let newIndex = currentImageIndex
    if (direction === 'prev') {
      newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : allImages.length - 1
    } else {
      newIndex = currentImageIndex < allImages.length - 1 ? currentImageIndex + 1 : 0
    }

    setCurrentImageIndex(newIndex)
    setSelectedImage(allImages[newIndex].url)
  }

  const openCollage = () => {
    setShowCollage(true)
  }

  const selectImageFromCollage = (imageUrl: string) => {
    const index = allImages.findIndex(img => img.url === imageUrl)
    setCurrentImageIndex(index >= 0 ? index : 0)
    setSelectedImage(imageUrl)
    setShowCollage(false)
  }

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
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {/* Count photos in answers */}
                    {(() => {
                      const photoCount = report.answers.reduce((count, answer) =>
                        count + (answer.photos ? answer.photos.length : 0), 0
                      )
                      const attachmentCount = report.attachments ? report.attachments.length : 0
                      const totalImages = photoCount + attachmentCount

                      return totalImages > 0 ? (
                        <span className="flex items-center">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          {totalImages} image{totalImages !== 1 ? 's' : ''}
                        </span>
                      ) : null
                    })()}
                    <span className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {report.answers.length} answer{report.answers.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                    {report.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
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
                    <p><strong>Priority:</strong> <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedReport.priority === 'high' ? 'bg-red-100 text-red-800' :
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
                  <div className="space-y-4">
                    {selectedReport.answers.map((answer, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-900 mb-1">Q: {answer.questionId}</p>
                        <p className="text-sm text-gray-700 mb-2">A: {answer.answer}</p>
                        {answer.notes && (
                          <p className="text-xs text-gray-600 mb-3 italic">Notes: {answer.notes}</p>
                        )}

                        {/* Display photos for this answer */}
                        {answer.photos && answer.photos.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Photos ({answer.photos.length})
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {answer.photos.map((photoUrl, photoIndex) => (
                                <div key={photoIndex} className="relative group">
                                  {imageLoadingStates[photoUrl] !== false && !imageErrorStates[photoUrl] && (
                                    <div className="absolute inset-0 bg-gray-200 rounded-md flex items-center justify-center z-10">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    </div>
                                  )}
                                  {imageErrorStates[photoUrl] ? (
                                    <div className="w-full h-20 bg-gray-200 rounded-md flex items-center justify-center border-2 border-dashed border-gray-300">
                                      <div className="text-center">
                                        <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                        <p className="text-xs text-gray-500">Failed to load</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      <img
                                        src={photoUrl}
                                        alt={`Photo ${photoIndex + 1} for question ${answer.questionId}`}
                                        className="w-full h-20 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                        onLoad={() => handleImageLoad(photoUrl)}
                                        onError={() => handleImageError(photoUrl)}
                                        onClick={() => openImageModal(photoUrl)}
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-md flex items-center justify-center">
                                        <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2" />
                    Attachments
                    {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                      <span className="ml-2 text-sm text-gray-500">({selectedReport.attachments.length})</span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {selectedReport.attachments && selectedReport.attachments.length > 0 ? (
                      selectedReport.attachments.map(att => (
                        <div key={att.id} className="relative group">
                          {att.type === 'photo' ? (
                            <>
                              {imageLoadingStates[att.url] !== false && !imageErrorStates[att.url] && (
                                <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center z-10">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                              )}
                              {imageErrorStates[att.url] ? (
                                <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                                  <div className="text-center">
                                    <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-xs text-gray-500">Failed to load</p>
                                    <p className="text-xs text-gray-400">{att.filename}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative">
                                  <img
                                    src={att.url}
                                    alt={att.filename}
                                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                    onLoad={() => handleImageLoad(att.url)}
                                    onError={() => handleImageError(att.url)}
                                    onClick={() => openImageModal(att.url)}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="truncate">{att.filename}</p>
                                    <p className="text-gray-300">{new Date(att.uploadedDate).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300 hover:bg-gray-200 transition-colors cursor-pointer">
                              <div className="text-center">
                                <FileText className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                                <p className="text-xs text-gray-700 font-medium">{att.type.toUpperCase()}</p>
                                <p className="text-xs text-gray-500 truncate max-w-full px-2">{att.filename}</p>
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center mt-1 text-xs text-blue-600 hover:text-blue-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Open
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 sm:col-span-3 text-center py-8">
                        <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No attachments found for this report.</p>
                      </div>
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

      {/* Enhanced Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex flex-col">
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold">
                    {allImages[currentImageIndex]?.title || 'Image'}
                  </h3>
                  {allImages.length > 1 && (
                    <span className="text-sm text-gray-300">
                      {currentImageIndex + 1} of {allImages.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {allImages.length > 1 && (
                    <button
                      onClick={openCollage}
                      className="bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
                      title="View all images"
                    >
                      <Grid3X3 className="h-5 w-5" />
                    </button>
                  )}
                  <a
                    href={selectedImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
                    title="Open original"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                  <button
                    onClick={closeImageModal}
                    className="bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Image Container */}
            <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-20">
              {/* Previous Button */}
              {allImages.length > 1 && (
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              {/* Image */}
              <div className="relative max-w-full max-h-full">
                {selectedImage && imageLoadingStates[selectedImage] !== false && !imageErrorStates[selectedImage] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                  </div>
                )}

                {selectedImage && imageErrorStates[selectedImage] ? (
                  <div className="flex flex-col items-center justify-center bg-black/60 text-white px-6 py-8 rounded-lg" onClick={(e) => e.stopPropagation()}>
                    <ImageIcon className="h-12 w-12 mb-3 text-white/70" />
                    <p className="text-sm text-center">Unable to load image. Please try opening the original file.</p>
                  </div>
                ) : (
                  <img
                    src={selectedImage || ''}
                    alt={allImages[currentImageIndex]?.title || 'Full size view'}
                    className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl ${selectedImage && imageLoadingStates[selectedImage] !== false ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
                    onLoad={() => selectedImage && handleImageLoad(selectedImage)}
                    onError={() => selectedImage && handleImageError(selectedImage)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>

              {/* Next Button */}
              {allImages.length > 1 && (
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors z-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-300">
                    Type: {allImages[currentImageIndex]?.type === 'answer' ? 'Answer Photo' : 'Attachment'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={() => navigateImage('prev')}
                        className="bg-black/50 hover:bg-black/70 rounded px-3 py-1 text-sm transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => navigateImage('next')}
                        className="bg-black/50 hover:bg-black/70 rounded px-3 py-1 text-sm transition-colors"
                      >
                        Next
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Keyboard Navigation Hint */}
            {allImages.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white/60 text-xs">
                Use ← → arrow keys to navigate
              </div>
            )}
          </div>

          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeImageModal}
          />
        </div>
      )}

      {/* Collage Modal */}
      {showCollage && allImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-60">
          <div className="relative w-full h-full max-w-7xl mx-auto p-6">
            {/* Collage Header */}
            <div className="flex items-center justify-between text-white mb-6">
              <div>
                <h2 className="text-2xl font-bold">All Images</h2>
                <p className="text-gray-300">{allImages.length} images from this report</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCollage(false)}
                  className="bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
                  title="Back to single view"
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
                <button
                  onClick={closeImageModal}
                  className="bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Collage Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-h-[calc(100vh-120px)] overflow-y-auto">
              {allImages.map((image, index) => (
                <div
                  key={index}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${index === currentImageIndex
                    ? 'ring-4 ring-blue-500 ring-opacity-75 scale-105'
                    : 'hover:scale-105 hover:ring-2 hover:ring-white/50'
                    }`}
                  onClick={() => selectImageFromCollage(image.url)}
                >
                  <div className="aspect-square relative">
                    {imageLoadingStates[image.url] !== false && !imageErrorStates[image.url] && (
                      <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    )}
                    {imageErrorStates[image.url] ? (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <div className="text-center text-white">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs opacity-75">Failed to load</p>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={image.url}
                        alt={image.title}
                        className="w-full h-full object-cover"
                        onLoad={() => handleImageLoad(image.url)}
                        onError={() => handleImageError(image.url)}
                      />
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Image Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-medium truncate">{image.title}</p>
                      <p className="text-gray-300 text-xs">
                        {image.type === 'answer' ? 'Answer Photo' : 'Attachment'}
                      </p>
                    </div>

                    {/* Current Image Indicator */}
                    {index === currentImageIndex && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Collage Footer */}
            <div className="flex items-center justify-center mt-6 text-white/60 text-sm">
              Click on any image to view it in full screen
            </div>
          </div>

          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeImageModal}
          />
        </div>
      )}
    </div>
  )
}
