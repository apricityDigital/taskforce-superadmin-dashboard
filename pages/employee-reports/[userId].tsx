import { useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  XCircle
} from 'lucide-react'
import { DataService, ComplianceReport, User } from '@/lib/dataService'
import { AIService } from '@/lib/aiService'
import { StatusPieChart } from '@/components/charts/StatusPieChart'
import { SimpleBarChart } from '@/components/charts/SimpleBarChart'

const toDateInputValue = (date: Date) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy.toISOString().slice(0, 10)
}

const normaliseDate = (value: any): Date | null => {
  if (!value) {
    return null
  }
  if (value instanceof Date) {
    return value
  }
  if (typeof value.toDate === 'function') {
    return value.toDate()
  }
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

const resolveReportDate = (report: ComplianceReport): Date | null => {
  return (
    normaliseDate(report.submittedAt) ||
    normaliseDate(report.updatedAt) ||
    normaliseDate(report.createdAt) ||
    normaliseDate(report.tripDate)
  )
}

const STATUS_COLORS: Record<string, string> = {
  approved: '#10b981',
  rejected: '#ef4444',
  pending: '#f59e0b',
  requires_action: '#6366f1'
}

export default function EmployeeReportsPage() {
  const router = useRouter()
  const initializationRef = useRef(false)
  const [user, setUser] = useState<User | null>(null)
  const [reports, setReports] = useState<ComplianceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)

  const today = useMemo(() => new Date(), [])
  const defaultStart = useMemo(() => {
    const copy = new Date()
    copy.setDate(copy.getDate() - 30)
    return toDateInputValue(copy)
  }, [])

  const [startDateInput, setStartDateInput] = useState<string>(defaultStart)
  const [endDateInput, setEndDateInput] = useState<string>(toDateInputValue(today))

  useEffect(() => {
    if (!router.isReady || initializationRef.current) {
      return
    }

    if (typeof router.query.startDate === 'string') {
      setStartDateInput(router.query.startDate)
    }
    if (typeof router.query.endDate === 'string') {
      setEndDateInput(router.query.endDate)
    }

    initializationRef.current = true
  }, [router.isReady, router.query.startDate, router.query.endDate])

  const { startDate, endDate, dateError } = useMemo(() => {
    if (!startDateInput || !endDateInput) {
      return { startDate: null, endDate: null, dateError: 'Please select both start and end dates.' }
    }

    const start = new Date(startDateInput)
    const end = new Date(endDateInput)

    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { startDate: null, endDate: null, dateError: 'Invalid date range selections.' }
    }

    if (start > end) {
      return { startDate: null, endDate: null, dateError: 'Start date must be before the end date.' }
    }

    return { startDate: start, endDate: end, dateError: null }
  }, [startDateInput, endDateInput])

  useEffect(() => {
    const fetchData = async () => {
      if (!router.isReady || typeof router.query.userId !== 'string') {
        return
      }

      if (dateError) {
        setReports([])
        return
      }

      setLoading(true)
      setError(null)

      const employeeId = router.query.userId

      try {
        const [users, employeeReports] = await Promise.all([
          DataService.getAllUsers(),
          DataService.getEmployeeReports(employeeId, {
            startDate: startDate ?? undefined,
            endDate: endDate ?? undefined
          })
        ])

        const foundUser = users.find(usr => usr.id === employeeId) || null
        setUser(foundUser)
        setReports(employeeReports)
      } catch (err) {
        console.error('Failed to load employee reports:', err)
        setError('Unable to load reports for this employee. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router.isReady, router.query.userId, startDate, endDate, dateError])

  const summary = useMemo(() => {
    const approved = reports.filter(report => report.status === 'approved').length
    const rejected = reports.filter(report => report.status === 'rejected').length
    const pending = reports.filter(report => report.status === 'pending').length
    const requiresAction = reports.filter(report => report.status === 'requires_action').length
    const uniqueFeederPoints = new Set(reports.map(report => report.feederPointName || report.feederPointId || 'Unspecified')).size

    return {
      total: reports.length,
      approved,
      rejected,
      pending,
      requiresAction,
      uniqueFeederPoints
    }
  }, [reports])

  const statusChartData = useMemo(() => {
    const entries: Array<{ name: string; value: number; color: string }> = []
    const pushIfValue = (name: string, value: number, color: string) => {
      if (value > 0) {
        entries.push({ name, value, color })
      }
    }

    pushIfValue('Approved', summary.approved, STATUS_COLORS.approved)
    pushIfValue('Rejected', summary.rejected, STATUS_COLORS.rejected)
    pushIfValue('Pending', summary.pending, STATUS_COLORS.pending)
    pushIfValue('Requires Action', summary.requiresAction, STATUS_COLORS.requires_action)

    return entries
  }, [summary])

  const feederDistribution = useMemo(() => {
    const counts = new Map<string, number>()
    reports.forEach(report => {
      const key = report.feederPointName || report.feederPointId || 'Unspecified'
      counts.set(key, (counts.get(key) || 0) + 1)
    })

    const palette = ['#2563eb', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6']
    let idx = 0
    return Array.from(counts.entries()).map(([name, value]) => {
      const color = palette[idx % palette.length]
      idx += 1
      return { name, value, color }
    })
  }, [reports])

  const uniqueEmployees = useMemo(() => {
    const names = new Set<string>()
    reports.forEach(report => {
      if (report.userName) {
        names.add(report.userName)
      }
    })
    return names.size
  }, [reports])

  const generateSummary = async () => {
    if (!user) {
      return
    }

    setGeneratingAI(true)
    setAiSummary(null)

    try {
      const reportData = {
        date: startDateInput || new Date().toISOString(),
        metrics: {
          totalUsers: uniqueEmployees,
          newRegistrations: 0,
          totalComplaints: summary.total,
          resolvedComplaints: summary.approved,
          activeFeederPoints: summary.uniqueFeederPoints,
          completedInspections: summary.total
        },
        performance: {
          complaintResolutionRate: summary.total > 0 ? Math.round((summary.approved / summary.total) * 100) : 0,
          userGrowth: 0,
          operationalEfficiency: summary.total > 0 ? Math.round(((summary.approved + summary.pending) / summary.total) * 100) : 0
        },
        rawReports: reports
      }

      const { summary: conciseSummary } = await AIService.generateAnalysis(reportData)
      setAiSummary(conciseSummary)
    } catch (err) {
      console.error('Failed to generate AI summary for employee reports:', err)
      setAiSummary('Unable to generate AI summary at this time. Please try again later.')
    } finally {
      setGeneratingAI(false)
    }
  }

  if (!router.isReady) {
    return null
  }

  return (
    <>
      <Head>
        <title>Employee Report History | SuperAdmin</title>
      </Head>

      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="btn-secondary flex items-center space-x-2 px-3 py-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user ? `${user.name}'s Report History` : 'Report History'}
              </h1>
              <p className="text-sm text-gray-500">
                Review every compliance report submitted by this employee within the selected date range.
              </p>
            </div>
          </div>
          <Link href="/employee-tracker" className="btn-secondary px-4 py-2">
            Go to Tracker
          </Link>
        </div>

        <div className="card grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Start date</label>
            <input
              type="date"
              value={startDateInput}
              onChange={event => setStartDateInput(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              max={endDateInput}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">End date</label>
            <input
              type="date"
              value={endDateInput}
              onChange={event => setEndDateInput(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min={startDateInput}
            />
          </div>
          {user && (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2 text-gray-700">
                <Mail className="h-4 w-4 text-indigo-500" />
                <span className="text-sm">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <Phone className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm">{user.phone}</span>
                </div>
              )}
              {user.organization && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <MapPin className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm">{user.organization}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col justify-center space-y-2">
            <div className="text-sm text-gray-500">Total Reports in Range</div>
            <div className="text-3xl font-semibold text-gray-900">{summary.total}</div>
            <div className="text-xs text-gray-500">
              Across {summary.uniqueFeederPoints} feeder points · {uniqueEmployees} unique submitters referenced
            </div>
          </div>
        </div>

        {dateError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{dateError}</span>
          </div>
        )}

        {loading ? (
          <div className="card flex items-center justify-center">
            <div className="flex items-center space-x-3 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading reports...</span>
            </div>
          </div>
        ) : error ? (
          <div className="card border-red-200 bg-red-50 text-red-700">
            <p className="font-semibold mb-2">Something went wrong</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Approved</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.approved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Rejected</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.rejected}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Feeder Points Covered</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.uniqueFeederPoints}</p>
                  </div>
                  <FileText className="h-8 w-8 text-indigo-500" />
                </div>
              </div>
            </div>

            <div className="card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">AI Summary Assistant</h2>
                  <p className="text-sm text-gray-500">
                    Generate a concise AI analysis of this employee&apos;s reports, including status distribution insights.
                  </p>
                </div>
                <button
                  onClick={generateSummary}
                  disabled={generatingAI || summary.total === 0}
                  className="btn-secondary flex items-center space-x-2 px-4 py-2 disabled:opacity-60"
                >
                  {generatingAI ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>{generatingAI ? 'Analyzing...' : 'Generate Concise AI Summary'}</span>
                </button>
              </div>

              {aiSummary && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-2">Concise Summary</h3>
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">{aiSummary}</pre>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-4">Status Breakdown</h3>
                  <StatusPieChart data={statusChartData} />
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-4">Feeder Point Distribution</h3>
                  <SimpleBarChart data={feederDistribution} xLabel="Feeder Points" yLabel="Reports" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Submitted Reports</h2>
                <span className="text-sm text-gray-500">{summary.total} records</span>
              </div>

              {summary.total === 0 ? (
                <div className="text-sm text-gray-500">No reports found for this employee within the selected range.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted At
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Feeder Point
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trip
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reports.map(report => {
                        const submittedAt = resolveReportDate(report)
                        const status = report.status || 'pending'
                        const statusLabel = status.replace('_', ' ')
                        const badgeColor =
                          status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'

                        return (
                          <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {submittedAt ? submittedAt.toLocaleString() : 'Unknown'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {report.feederPointName || report.feederPointId || 'Unspecified'}
                            </td>
                            <td className="px-4 py-3 text-sm capitalize">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {report.tripNumber ? `Trip ${report.tripNumber}` : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {report.description ? report.description.slice(0, 120) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
