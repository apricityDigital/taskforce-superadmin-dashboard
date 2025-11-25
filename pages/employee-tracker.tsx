import { useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import {
  AlertTriangle,
  Award,
  CheckCircle,
  Download,
  Eye,
  Image as ImageIcon,
  Loader2,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  X,
  XCircle
} from 'lucide-react'
import { DataService, EmployeePerformance, ComplianceReport, FeederPointSummary } from '@/lib/dataService'
import { AIService } from '@/lib/aiService'
import { StatusPieChart } from '@/components/charts/StatusPieChart'
import { SimpleBarChart } from '@/components/charts/SimpleBarChart'
import { SummaryTrendChart } from '@/components/charts/SummaryTrendChart'
import type { KeyboardEvent, RefObject } from 'react'

const formatPercent = (value: number) => `${Math.round((value || 0) * 100)}%`
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
    normaliseDate(report.tripDate) ||
    null
  )
}

const YES_VALUES = new Set(['yes', 'y', 'true', '1'])
const NO_VALUES = new Set(['no', 'n', 'false', '0'])

const formatQuestionLabel = (value: string) => {
  const cleaned = value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned ? cleaned.toLowerCase() : 'question'
}

export default function EmployeeTrackerPage() {
  const [performance, setPerformance] = useState<EmployeePerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDateInput, setStartDateInput] = useState(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 30)
    return toDateInputValue(start)
  })
  const [endDateInput, setEndDateInput] = useState(() => toDateInputValue(new Date()))
  const [focusUserId, setFocusUserId] = useState<string>('all')
  const [feederSummaries, setFeederSummaries] = useState<FeederPointSummary[]>([])
  const [feederLoading, setFeederLoading] = useState(true)
  const [selectedFeederKey, setSelectedFeederKey] = useState<string | null>(null)
  const [feederGeneratingAI, setFeederGeneratingAI] = useState(false)
  const [feederAiSummary, setFeederAiSummary] = useState<string | null>(null)
  const [feederQuestionChartData, setFeederQuestionChartData] = useState<Array<{ name: string; yes: number; no: number }>>([])
  const [selectedFeederReport, setSelectedFeederReport] = useState<ComplianceReport | null>(null)
  const [selectedReportImage, setSelectedReportImage] = useState<string | null>(null)
  const statsSectionRef = useRef<HTMLDivElement | null>(null)
  const employeeSectionRef = useRef<HTMLDivElement | null>(null)
  const feederOverviewSectionRef = useRef<HTMLDivElement | null>(null)
  const feederReportsSectionRef = useRef<HTMLDivElement | null>(null)

  const router = useRouter()

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
    const load = async () => {
      if (dateError) {
        setPerformance([])
        setLoading(false)
        setFeederSummaries([])
        setFeederLoading(false)
        return
      }

      try {
        setLoading(true)
        setFeederLoading(true)
        const [employeeResults, feederResults] = await Promise.all([
          DataService.getEmployeePerformance({
            role: 'task_force_team',
            startDate: startDate ?? undefined,
            endDate: endDate ?? undefined,
            includeInactive: false
          }),
          DataService.getFeederPointSummaries({
            startDate: startDate ?? undefined,
            endDate: endDate ?? undefined
          })
        ])
        setPerformance(employeeResults)
        setFeederSummaries(feederResults)

        setFocusUserId(prev =>
          prev !== 'all' && !employeeResults.find(item => item.userId === prev) ? 'all' : prev
        )
        setSelectedFeederKey(prev =>
          prev && !feederResults.find(item => item.key === prev) ? null : prev
        )
      } catch (error) {
        console.error('Failed to load employee performance:', error)
        setFeederSummaries([])
      } finally {
        setLoading(false)
        setFeederLoading(false)
      }
    }

    load()
  }, [startDate, endDate, dateError])

  const filteredPerformance = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const base = focusUserId === 'all'
      ? performance
      : performance.filter(person => person.userId === focusUserId)

    if (!term) {
      return base
    }

    return base.filter(person => {
      const haystack = `${person.name} ${person.email} ${person.role}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [performance, searchTerm, focusUserId])

  const summary = useMemo(() => {
    const totals = performance.reduce(
      (acc, item) => {
        acc.totalReports += item.totalReports
        acc.approvedReports += item.approvedReports
        acc.rejectedReports += item.rejectedReports
        acc.pendingReports += item.pendingReports
        acc.totalApprovalRate += item.approvalRate
        return acc
      },
      {
        totalReports: 0,
        approvedReports: 0,
        rejectedReports: 0,
        pendingReports: 0,
        totalApprovalRate: 0
      }
    )

    const activeEmployees = performance.filter(item => item.totalReports > 0).length
    const averageApprovalRate = activeEmployees
      ? totals.totalApprovalRate / activeEmployees
      : 0

    return {
      totalEmployees: performance.length,
      totalReports: totals.totalReports,
      approvedReports: totals.approvedReports,
      rejectedReports: totals.rejectedReports,
      pendingReports: totals.pendingReports,
      activeEmployees,
      averageApprovalRate
    }
  }, [performance])

  const topPerformers = useMemo(() => {
    return performance
      .filter(person => person.totalReports > 0)
      .slice()
      .sort((a, b) => {
        if (b.approvalRate !== a.approvalRate) {
          return b.approvalRate - a.approvalRate
        }
        if (b.approvedReports !== a.approvedReports) {
          return b.approvedReports - a.approvedReports
        }
        return b.totalReports - a.totalReports
      })
      .slice(0, 3)
  }, [performance])

  const lowestPerformers = useMemo(() => {
    return performance
      .filter(person => person.totalReports > 0)
      .slice()
      .sort((a, b) => {
        if (a.approvalRate !== b.approvalRate) {
          return a.approvalRate - b.approvalRate
        }
        if (b.rejectedReports !== a.rejectedReports) {
          return b.rejectedReports - a.rejectedReports
        }
        return b.totalReports - a.totalReports
      })
      .slice(0, 3)
  }, [performance])

  const selectedFeederSummary = useMemo(() => {
    if (!selectedFeederKey) {
      return null
    }
    return feederSummaries.find(summary => summary.key === selectedFeederKey) || null
  }, [selectedFeederKey, feederSummaries])

  useEffect(() => {
    setFeederAiSummary(null)
    setFeederGeneratingAI(false)
    setFeederQuestionChartData([])
    setSelectedFeederReport(null)
    setSelectedReportImage(null)
  }, [selectedFeederKey, startDateInput, endDateInput])

  const feederAggregate = useMemo(() => {
    if (!selectedFeederSummary) {
      return { total: 0, approved: 0, rejected: 0, pending: 0, requiresAction: 0, uniqueEmployees: 0 }
    }

    const reports = selectedFeederSummary.reports
    const approved = reports.filter(report => report.status === 'approved').length
    const rejected = reports.filter(report => report.status === 'rejected').length
    const pending = reports.filter(report => report.status === 'pending').length
    const requiresAction = reports.filter(report => report.status === 'requires_action').length
    const uniqueEmployees = new Set(reports.map(report => report.userName || report.submittedBy || 'Unknown')).size

    return {
      total: reports.length,
      approved,
      rejected,
      pending,
      requiresAction,
      uniqueEmployees
    }
  }, [selectedFeederSummary])

  const feederStatusData = useMemo(() => {
    if (!selectedFeederSummary) {
      return []
    }
    const data: Array<{ name: string; value: number; color: string }> = []
    const push = (name: string, value: number, color: string) => {
      if (value > 0) {
        data.push({ name, value, color })
      }
    }

    push('Approved', feederAggregate.approved, '#10b981')
    push('Rejected', feederAggregate.rejected, '#ef4444')
    push('Pending', feederAggregate.pending, '#f59e0b')
    push('Requires Action', feederAggregate.requiresAction, '#6366f1')
    return data
  }, [selectedFeederSummary, feederAggregate])

  const feederTripData = useMemo(() => {
    if (!selectedFeederSummary) {
      return []
    }
    const counts = new Map<string, number>()
    selectedFeederSummary.reports.forEach(report => {
      const label = report.tripNumber ? `Trip ${report.tripNumber}` : 'Unspecified Trip'
      counts.set(label, (counts.get(label) || 0) + 1)
    })
    const palette = ['#2563eb', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6']
    let index = 0
    return Array.from(counts.entries()).map(([name, value]) => {
      const color = palette[index % palette.length]
      index += 1
      return { name, value, color }
    })
  }, [selectedFeederSummary])

  const handleRowKeyDown = (event: KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }

  const navigateToEmployeeReports = (employeeId: string) => {
    const query = new URLSearchParams()
    if (startDateInput) {
      query.set('startDate', startDateInput)
    }
    if (endDateInput) {
      query.set('endDate', endDateInput)
    }
    if (focusUserId !== 'all') {
      query.set('focus', focusUserId)
    }
    router.push(`/employee-reports/${employeeId}?${query.toString()}`)
  }

  const buildQuestionStats = (reports: ComplianceReport[]) => {
    const counts = new Map<string, { yes: number; no: number }>()

    reports.forEach(report => {
      if (!Array.isArray(report.answers)) {
        return
      }

      report.answers.forEach(answer => {
        const rawQuestion = (answer.questionId || answer.description || 'question').toString()
        const questionLabel = formatQuestionLabel(rawQuestion)
        const rawAnswer = (answer.answer || '').toString().trim().toLowerCase()
        const normalized = rawAnswer.replace(/\s+/g, '')

        let bucket: 'yes' | 'no' | null = null
        if (YES_VALUES.has(normalized)) {
          bucket = 'yes'
        } else if (NO_VALUES.has(normalized)) {
          bucket = 'no'
        }

        if (!bucket) {
          return
        }

        const current = counts.get(questionLabel) || { yes: 0, no: 0 }
        current[bucket] += 1
        counts.set(questionLabel, current)
      })
    })

    return Array.from(counts.entries()).map(([name, totals]) => ({
      name,
      yes: totals.yes,
      no: totals.no
    }))
  }

  const generateFeederSummary = async () => {
    if (!selectedFeederSummary || feederAggregate.total === 0) {
      return
    }

    const questionStats = buildQuestionStats(selectedFeederSummary.reports)
    setFeederQuestionChartData(questionStats)
    const questionLines = questionStats.map(
      stat => `For "${stat.name}": ${stat.yes} reports answered 'yes' and ${stat.no} reports answered 'no'.`
    )
    const numericSummarySection =
      questionStats.length > 0
        ? `Numerical Summary of Key Questions:\n${questionLines.join('\n')}`
        : selectedFeederSummary.reports.length
          ? 'Numerical Summary of Key Questions:\nNo yes/no responses were captured for this feeder point in the selected range.'
          : ''

    setFeederGeneratingAI(true)
    setFeederAiSummary(null)

    try {
      const reportData = {
        date: startDateInput || new Date().toISOString(),
        metrics: {
          totalUsers: feederAggregate.uniqueEmployees,
          newRegistrations: 0,
          totalComplaints: feederAggregate.total,
          resolvedComplaints: feederAggregate.approved,
          activeFeederPoints: 1,
          completedInspections: feederAggregate.total
        },
        performance: {
          complaintResolutionRate: feederAggregate.total > 0 ? Math.round((feederAggregate.approved / feederAggregate.total) * 100) : 0,
          userGrowth: 0,
          operationalEfficiency: feederAggregate.total > 0 ? Math.round(((feederAggregate.approved + feederAggregate.pending) / feederAggregate.total) * 100) : 0
        },
        rawReports: selectedFeederSummary.reports
      }

      const { summary } = await AIService.generateAnalysis(reportData)
      const summaryText = summary?.trim() || ''
      setFeederAiSummary(summaryText || null)
    } catch (error) {
      console.error('Failed to generate feeder point AI summary:', error)
      const fallback = ['Unable to generate AI summary for this feeder point right now. Please try again later.', numericSummarySection]
        .filter(Boolean)
        .join('\n\n')
      setFeederAiSummary(fallback)
    } finally {
      setFeederGeneratingAI(false)
    }

  }

  const handleDownloadFeederSummary = () => {
    if (!selectedFeederSummary) {
      return
    }

    const questionLines = feederQuestionChartData.map(
      stat => `For "${stat.name}": ${stat.yes} reports answered 'yes' and ${stat.no} reports answered 'no'.`
    )
    const numericSummarySection =
      questionLines.length > 0 ? `Numerical Summary of Key Questions:\n${questionLines.join('\n')}` : ''

    const textSegments = [
      feederAiSummary && feederAiSummary.trim(),
      !feederAiSummary?.includes('Numerical Summary of Key Questions') ? numericSummarySection : ''
    ]
      .filter(Boolean)
      .join('\n\n')

    if (!textSegments) {
      return
    }

    const fileName = `Feeder_Summary_${(selectedFeederSummary.feederPointName || 'report')
      .replace(/\s+/g, '_')
      .replace(/[^\w_-]/g, '')}.txt`
    const blob = new Blob([textSegments], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const formatReportDate = (report: ComplianceReport) => {
    const submittedAt = resolveReportDate(report)
    return submittedAt ? submittedAt.toLocaleString() : 'Unknown'
  }

  const extractReportImages = (report: ComplianceReport) => {
    const answerPhotos = report.answers.reduce<string[]>((acc, answer) => {
      if (answer.photos && answer.photos.length > 0) {
        acc.push(...answer.photos)
      }
      return acc
    }, [])

    const attachmentPhotos = (report.attachments || [])
      .filter(att => att.type === 'photo')
      .map(att => att.url)

    return [...answerPhotos, ...attachmentPhotos]
  }

  const selectedFeederImages = useMemo(
    () => (selectedFeederReport ? extractReportImages(selectedFeederReport) : []),
    [selectedFeederReport]
  )

  const scrollToSection = (ref: RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="text-lg font-semibold text-gray-700">Loading employee performance</div>
          <div className="text-sm text-gray-500">Please wait while we gather the latest reports.</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Employee Work Tracker | SuperAdmin</title>
      </Head>

      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Employee Work Tracker</h1>
          <p className="text-gray-600">
            Monitor report submissions, review outcomes, and highlight the top and lowest performers
            across your task force teams.
          </p>
        </div>

        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Focus on</label>
              <select
                value={focusUserId}
                onChange={event => setFocusUserId(event.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Task Force Employees</option>
                {performance.map(person => (
                  <option key={person.userId} value={person.userId}>
                    {person.name} ({formatPercent(person.approvalRate)})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Search by name, email, or role"
                  type="text"
                />
              </div>
            </div>
          </div>
          {dateError && (
            <p className="mt-3 text-sm text-red-600">{dateError}</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => scrollToSection(statsSectionRef)}
            className="btn-secondary px-3 py-2 text-sm"
          >
            Jump to Summary
          </button>
          <button
            type="button"
            onClick={() => scrollToSection(employeeSectionRef)}
            className="btn-secondary px-3 py-2 text-sm"
          >
            Jump to Employee Activity
          </button>
          <button
            type="button"
            onClick={() => scrollToSection(feederOverviewSectionRef)}
            className="btn-secondary px-3 py-2 text-sm"
          >
            Jump to Feeder Overview
          </button>
          <button
            type="button"
            onClick={() => scrollToSection(feederReportsSectionRef)}
            className="btn-secondary px-3 py-2 text-sm"
          >
            Jump to Feeder Reports
          </button>
        </div>

        <div ref={statsSectionRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">{summary.activeEmployees} submitted reports</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Reports Submitted</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.totalReports}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {summary.approvedReports} approved | {summary.pendingReports} pending
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Approval Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPercent(summary.averageApprovalRate)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {summary.rejectedReports} reports rejected overall
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Attention</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.pendingReports}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Reports awaiting review or follow-up</p>
          </div>
        </div>

        <div ref={employeeSectionRef} className="card">
          <h2 className="text-xl font-semibold text-gray-900">Employee Activity</h2>
          <p className="text-sm text-gray-500 mb-4">
            Click a team member to inspect their report history within the selected date range.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Reports
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rejected
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approval Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Submission
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                      {dateError
                        ? 'Adjust the date range to continue.'
                        : 'No employees match your filters. Try adjusting the filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredPerformance.map(employee => (
                    <tr
                      key={employee.userId}
                      role="button"
                      tabIndex={0}
                      aria-selected={focusUserId === employee.userId}
                      onClick={() => navigateToEmployeeReports(employee.userId)}
                      onKeyDown={event => handleRowKeyDown(event, () => navigateToEmployeeReports(employee.userId))}
                      className={`hover:bg-indigo-50 transition-colors cursor-pointer ${
                        focusUserId === employee.userId ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{employee.role}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{employee.totalReports}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600 font-semibold">
                        {employee.approvedReports}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                        {employee.rejectedReports}
                      </td>
                      <td className="px-4 py-3 text-sm text-amber-600 font-semibold">
                        {employee.pendingReports}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatPercent(employee.approvalRate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {employee.lastReportAt
                          ? employee.lastReportAt.toLocaleString()
                          : 'No submissions yet'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div ref={feederOverviewSectionRef} className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Feeder Point Overview</h2>
                <p className="text-sm text-gray-500">
                  Review submission volume and status distribution per feeder point.
                </p>
              </div>
              {feederLoading ? (
                <div className="text-sm text-gray-500">Loading feeder points...</div>
              ) : (
                <div className="text-sm text-gray-600">
                  {feederSummaries.length} feeder point{feederSummaries.length === 1 ? '' : 's'} in view.
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feeder Point
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approved
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rejected
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pending
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feederLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                        Loading feeder data...
                      </td>
                    </tr>
                  ) : feederSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                        No feeder point activity in this date range.
                      </td>
                    </tr>
                  ) : (
                    feederSummaries.map(summary => (
                      <tr
                        key={summary.key}
                        role="button"
                        tabIndex={0}
                        aria-selected={selectedFeederKey === summary.key}
                        onClick={() => setSelectedFeederKey(summary.key)}
                        onKeyDown={event => handleRowKeyDown(event, () => setSelectedFeederKey(summary.key))}
                        className={`hover:bg-indigo-50 transition-colors cursor-pointer ${
                          selectedFeederKey === summary.key ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{summary.feederPointName}</div>
                          <div className="text-xs text-gray-500">{summary.feederPointId || 'No ID'}</div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {summary.totalReports}
                        </td>
                        <td className="px-4 py-3 text-sm text-emerald-600 font-semibold">
                          {summary.approvedReports}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                          {summary.rejectedReports}
                        </td>
                        <td className="px-4 py-3 text-sm text-amber-600 font-semibold">
                          {summary.pendingReports}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div ref={feederReportsSectionRef} className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Feeder Point Reports</h2>
                <p className="text-sm text-gray-500">
                  Select a feeder point to inspect all submissions within the chosen dates.
                </p>
              </div>
              {selectedFeederSummary && (
                <div className="text-sm text-gray-600">
                  {selectedFeederSummary.reports.length} report
                  {selectedFeederSummary.reports.length === 1 ? '' : 's'} selected
                </div>
              )}
            </div>

            {!selectedFeederSummary ? (
              <p className="mt-4 text-sm text-gray-500">
                Choose a feeder point from the list to view its submitted reports.
              </p>
            ) : (
              <>
                <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedFeederSummary.feederPointName}</p>
                    <p className="text-xs text-gray-500">
                      {feederAggregate.total} report{feederAggregate.total === 1 ? '' : 's'} | {feederAggregate.uniqueEmployees}{' '}
                      contributor{feederAggregate.uniqueEmployees === 1 ? '' : 's'}
                    </p>
                  </div>
                  <button
                    onClick={generateFeederSummary}
                    disabled={feederGeneratingAI || feederAggregate.total === 0}
                    className="btn-secondary flex items-center space-x-2 px-3 py-2 disabled:opacity-60"
                  >
                    {feederGeneratingAI ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span>{feederGeneratingAI ? 'Analyzing...' : 'Generate Concise AI Summary'}</span>
                  </button>
                </div>

                {(feederAiSummary || feederQuestionChartData.length > 0) && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                    {feederAiSummary && (
                      <>
                        <h3 className="text-sm font-semibold text-gray-900">Concise Summary</h3>
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">{feederAiSummary}</pre>
                      </>
                    )}
                    <button
                      onClick={handleDownloadFeederSummary}
                      disabled={feederGeneratingAI || (!feederAiSummary && feederQuestionChartData.length === 0)}
                      className="btn-secondary flex w-full items-center justify-center space-x-2 px-3 py-2 disabled:opacity-60"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Summary</span>
                    </button>
                  </div>
                )}

                {feederQuestionChartData.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Numerical Summary of Key Questions</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        {feederQuestionChartData.map(stat => (
                          <p key={stat.name}>
                            For "{stat.name}": {stat.yes} reports answered &apos;yes&apos; and {stat.no} reports answered &apos;no&apos;.
                          </p>
                        ))}
                      </div>
                    </div>
                    <SummaryTrendChart
                      data={feederQuestionChartData.map(stat => ({
                        name: stat.name,
                        yes: stat.yes,
                        no: stat.no
                      }))}
                      xLabel="Question"
                      yLabel="Responses"
                    />
                  </div>
                )}

                {feederAggregate.total > 0 && (
                  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Status Breakdown</h3>
                      <StatusPieChart data={feederStatusData} />
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Trips Distribution</h3>
                    <SimpleBarChart data={feederTripData} xLabel="Trip" yLabel="Reports" />
                    </div>
                  </div>
                )}

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted At
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trip
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedFeederSummary.reports.map(report => {
                        const submittedAt = resolveReportDate(report)
                        const status = report.status || 'pending'
                        const badgeColor =
                          status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'

                        return (
                          <tr key={report.id}>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {submittedAt ? submittedAt.toLocaleString() : 'Unknown'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {report.userName || report.submittedBy || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm capitalize">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
                                {status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {report.tripNumber ? `Trip ${report.tripNumber}` : 'N/A'}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setSelectedFeederReport(report)}
                                className="btn-secondary flex items-center space-x-2 px-3 py-2 text-sm"
                              >
                                <Eye className="h-4 w-4" />
                                <span>View Report</span>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

              </>
            )}
          </div>
        </div>

        {selectedFeederReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Feeder Point Report</p>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedFeederReport.feederPointName || 'Feeder Point'}
                  </h3>
                  <p className="text-sm text-gray-600">Submitted {formatReportDate(selectedFeederReport)}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFeederReport(null)
                    setSelectedReportImage(null)
                  }}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                  aria-label="Close report details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                    <p>
                      <span className="font-semibold text-gray-900">Employee:</span>{' '}
                      {selectedFeederReport.userName || selectedFeederReport.submittedBy || 'Unknown'}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900">Team:</span>{' '}
                      {selectedFeederReport.teamName || 'N/A'}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900">Status:</span>{' '}
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          selectedFeederReport.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : selectedFeederReport.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : selectedFeederReport.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {(selectedFeederReport.status || 'pending').replace('_', ' ')}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900">Trip:</span>{' '}
                      {selectedFeederReport.tripNumber ? `Trip ${selectedFeederReport.tripNumber}` : 'N/A'}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900">Trip Date:</span>{' '}
                      {selectedFeederReport.tripDate || 'N/A'}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900">Feeder Point:</span>{' '}
                      {selectedFeederReport.feederPointName || 'N/A'}
                    </p>
                    <p className="sm:col-span-2">
                      <span className="font-semibold text-gray-900">Location:</span>{' '}
                      {selectedFeederReport.submittedLocation?.address || 'Not provided'}{' '}
                      {selectedFeederReport.distanceFromFeederPoint ? (
                        <span className="text-gray-500">
                          ({selectedFeederReport.distanceFromFeederPoint.toFixed(2)}m from feeder point)
                        </span>
                      ) : null}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900">Report Answers</h4>
                    {selectedFeederReport.answers.length === 0 ? (
                      <p className="text-sm text-gray-600">No answers recorded for this submission.</p>
                    ) : (
                      selectedFeederReport.answers.map((answer, index) => (
                        <div key={answer.questionId || index} className="rounded-lg border border-gray-200 p-3">
                          <p className="text-sm font-medium text-gray-900">
                            {answer.description || answer.questionId || 'Question'}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">Answer: {answer.answer || 'N/A'}</p>
                          {answer.notes && <p className="text-xs text-gray-500 mt-1">Notes: {answer.notes}</p>}

                          {answer.photos && answer.photos.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                                <ImageIcon className="h-4 w-4" />
                                <span>Photos</span>
                                <span className="text-gray-500">({answer.photos.length})</span>
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {answer.photos.map((photoUrl, photoIndex) => (
                                  <button
                                    key={`${answer.questionId || 'answer'}-${photoIndex}`}
                                    onClick={() => setSelectedReportImage(photoUrl)}
                                    className="group relative overflow-hidden rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  >
                                    <img
                                      src={photoUrl}
                                      alt={`Answer photo ${photoIndex + 1}`}
                                      className="h-24 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                          <ImageIcon className="h-4 w-4" />
                          <span>Images</span>
                        </h4>
                        <p className="text-xs text-gray-500">Click an image to enlarge</p>
                      </div>
                      <span className="text-xs text-gray-600">
                        {selectedFeederImages.length} file{selectedFeederImages.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    {selectedFeederImages.length > 0 ? (
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {selectedFeederImages.map((url, idx) => (
                          <button
                            key={`${selectedFeederReport.id}-image-${idx}`}
                            onClick={() => setSelectedReportImage(url)}
                            className="group relative overflow-hidden rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <img
                              src={url}
                              alt={`Report image ${idx + 1}`}
                              className="h-24 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-gray-600">No images attached to this report.</p>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Attachments</h4>
                    {selectedFeederReport.attachments && selectedFeederReport.attachments.length > 0 ? (
                      <div className="space-y-3">
                        {selectedFeederReport.attachments.map(att => (
                          <div key={att.id} className="rounded-md border border-gray-100 p-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-gray-900">{att.filename}</p>
                              <span className="text-xs text-gray-600">{att.type.toUpperCase()}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                              <span>{att.uploadedDate ? new Date(att.uploadedDate).toLocaleDateString() : 'Date unknown'}</span>
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 font-semibold"
                              >
                                Open
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">No attachments included.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedReportImage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
            <button
              onClick={() => setSelectedReportImage(null)}
              className="absolute right-6 top-6 rounded-full bg-white/90 p-2 text-gray-800 shadow hover:bg-white"
              aria-label="Close image preview"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={selectedReportImage}
              alt="Report attachment preview"
              className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
            />
          </div>
        )}

      </div>
    </>
  )
}
