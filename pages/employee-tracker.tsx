import { Fragment, useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Dialog, Transition } from '@headlessui/react'
import {
  AlertTriangle,
  Award,
  CheckCircle,
  Download,
  Eye,
  Loader2,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-react'
import { DataService, EmployeePerformance, ComplianceReport, FeederPointSummary } from '@/lib/dataService'
import { AIService } from '@/lib/aiService'
import { StatusPieChart } from '@/components/charts/StatusPieChart'
import { SimpleBarChart } from '@/components/charts/SimpleBarChart'
import { SummaryTrendChart } from '@/components/charts/SummaryTrendChart'
import type { KeyboardEvent } from 'react'

const formatPercent = (value: number) => `${Math.round((value || 0) * 100)}%`
const toDateInputValue = (date: Date) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  const timezoneAdjusted = new Date(copy.getTime() - copy.getTimezoneOffset() * 60000)
  return timezoneAdjusted.toISOString().slice(0, 10)
}
const fromDateInputValue = (value: string): Date | null => {
  if (!value) {
    return null
  }
  const [yearStr, monthStr, dayStr] = value.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  if (!year || !month || !day) {
    return null
  }
  const date = new Date(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
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

const UNSPECIFIED_TRIP_VALUE = '__unspecified'
const isUnspecifiedTripNumber = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return true
  }
  if (typeof value === 'string') {
    return value.trim() === ''
  }
  return false
}
const isSameDay = (first: Date, second: Date) => {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  )
}
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.heic', '.heif'])
const isImageUrl = (value: string | null | undefined) => {
  if (!value) {
    return false
  }
  const lower = value.toLowerCase()
  if (lower.startsWith('data:image')) {
    return true
  }
  try {
    const url = new URL(lower, 'http://dummy-base')
    const pathname = url.pathname || lower
    return Array.from(IMAGE_EXTENSIONS).some(ext => pathname.endsWith(ext))
  } catch {
    return Array.from(IMAGE_EXTENSIONS).some(ext => lower.endsWith(ext))
  }
}

type FeederPerformanceInsight = {
  key: string
  feederPointName: string
  totalReports: number
  approvedReports: number
  rejectedReports: number
  pendingReports: number
  requiresAction: number
  approvalRate: number
  lastReportAt: Date | null
}

export default function EmployeeTrackerPage() {
  const [performance, setPerformance] = useState<EmployeePerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDateInput, setStartDateInput] = useState(() => toDateInputValue(new Date()))
  const [endDateInput, setEndDateInput] = useState(() => toDateInputValue(new Date()))
  const [focusUserId, setFocusUserId] = useState<string>('all')
  const [feederSummaries, setFeederSummaries] = useState<FeederPointSummary[]>([])
  const [feederLoading, setFeederLoading] = useState(true)
  const [selectedFeederKey, setSelectedFeederKey] = useState<string | null>(null)
  const [feederGeneratingAI, setFeederGeneratingAI] = useState(false)
  const [feederAiSummary, setFeederAiSummary] = useState<string | null>(null)
  const [feederQuestionChartData, setFeederQuestionChartData] = useState<Array<{ name: string; yes: number; no: number }>>([])
  const [tripFilter, setTripFilter] = useState<string>('all')
  const [bestWorstMode, setBestWorstMode] = useState<'range' | 'single'>('range')
  const [bestWorstSingleDayInput, setBestWorstSingleDayInput] = useState(() => toDateInputValue(new Date()))
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null)
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null)

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

  useEffect(() => {
    if (!startDateInput) {
      return
    }

    if (!bestWorstSingleDayInput) {
      setBestWorstSingleDayInput(startDateInput)
      return
    }

    const current = fromDateInputValue(bestWorstSingleDayInput)
    const start = fromDateInputValue(startDateInput)
    const end = endDateInput ? fromDateInputValue(endDateInput) : null

    if (!current || (start && current < start)) {
      setBestWorstSingleDayInput(startDateInput)
      return
    }

    if (end && current > end) {
      setBestWorstSingleDayInput(endDateInput)
    }
  }, [bestWorstSingleDayInput, endDateInput, startDateInput])

  const bestWorstSingleDay = useMemo(() => {
    return bestWorstSingleDayInput ? fromDateInputValue(bestWorstSingleDayInput) : null
  }, [bestWorstSingleDayInput])

  const bestWorstSingleDayLabel = useMemo(() => {
    return bestWorstSingleDay ? bestWorstSingleDay.toLocaleDateString() : ''
  }, [bestWorstSingleDay])

  useEffect(() => {
    if (!selectedReport) {
      setPreviewImage(null)
    }
  }, [selectedReport])

  const feederPerformanceInsights = useMemo<{
    best: FeederPerformanceInsight | null
    worst: FeederPerformanceInsight | null
    hasData: boolean
    onlyOne: boolean
    mode: typeof bestWorstMode
  }>(() => {
    if (feederSummaries.length === 0) {
      return { best: null, worst: null, hasData: false, onlyOne: false, mode: bestWorstMode }
    }

    if (bestWorstMode === 'single' && !bestWorstSingleDay) {
      return { best: null, worst: null, hasData: false, onlyOne: false, mode: bestWorstMode }
    }

    const computeMetrics = (reports: ComplianceReport[]) => {
      let approved = 0
      let rejected = 0
      let pending = 0
      let requiresAction = 0
      let latest: Date | null = null

      reports.forEach(report => {
        const status = (report.status || '').toLowerCase()

        if (status === 'approved') {
          approved += 1
        } else if (status === 'rejected') {
          rejected += 1
        } else if (status === 'requires_action') {
          pending += 1
          requiresAction += 1
        } else {
          pending += 1
        }

        const reportDate = resolveReportDate(report)
        if (reportDate && (!latest || reportDate > latest)) {
          latest = reportDate
        }
      })

      const total = reports.length
      const approvalRate = total > 0 ? approved / total : 0

      return {
        totalReports: total,
        approvedReports: approved,
        rejectedReports: rejected,
        pendingReports: pending,
        requiresAction,
        approvalRate,
        lastReportAt: latest
      }
    }

    const scored = feederSummaries
      .map(summary => {
        const reports =
          bestWorstMode === 'single' && bestWorstSingleDay
            ? summary.reports.filter(report => {
                const reportDate = resolveReportDate(report)
                return reportDate ? isSameDay(reportDate, bestWorstSingleDay) : false
              })
            : summary.reports

        const metrics = computeMetrics(reports)

        return {
          key: summary.key,
          feederPointName: summary.feederPointName,
          metrics
        }
      })
      .filter(entry => entry.metrics.totalReports > 0)

    if (scored.length === 0) {
      return { best: null, worst: null, hasData: false, onlyOne: false, mode: bestWorstMode }
    }

    scored.sort((a, b) => {
      if (b.metrics.approvalRate !== a.metrics.approvalRate) {
        return b.metrics.approvalRate - a.metrics.approvalRate
      }
      return b.metrics.totalReports - a.metrics.totalReports
    })

    const mapToInsight = (entry: typeof scored[number]): FeederPerformanceInsight => ({
      key: entry.key,
      feederPointName: entry.feederPointName,
      ...entry.metrics
    })

    const best = mapToInsight(scored[0])
    const worst = mapToInsight(scored[scored.length - 1])

    return {
      best,
      worst,
      hasData: true,
      onlyOne: scored.length === 1,
      mode: bestWorstMode
    }
  }, [bestWorstMode, bestWorstSingleDay, feederSummaries])

  const {
    best: bestFeederInsight,
    worst: worstFeederInsight,
    hasData: hasFeederInsights,
    onlyOne: onlyOneFeeder,
    mode: feederInsightsMode
  } = feederPerformanceInsights

  const selectedReportMeta = useMemo(() => {
    if (!selectedReport) {
      return null
    }
    const submittedAt = resolveReportDate(selectedReport)
    const status = selectedReport.status || 'pending'
    const badgeColor =
      status === 'approved'
        ? 'bg-emerald-100 text-emerald-700'
        : status === 'rejected'
          ? 'bg-red-100 text-red-700'
          : status === 'pending'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-blue-100 text-blue-700'

    return {
      submittedAt,
      status,
      badgeColor
    }
  }, [selectedReport])

  const reportMedia = useMemo(() => {
    if (!selectedReport) {
      return { images: [] as Array<{
        key: string
        name: string
        url: string
        source: 'attachment' | 'answer'
        questionLabel?: string
        type?: string
      }>, files: [] as Array<{
        key: string
        name: string
        url: string
        type?: string
      }>, hasMedia: false }
    }

    const imageItems: Array<{
      key: string
      name: string
      url: string
      source: 'attachment' | 'answer'
      questionLabel?: string
      type?: string
    }> = []
    const fileItems: Array<{
      key: string
      name: string
      url: string
      type?: string
    }> = []
    const seen = new Set<string>()

    const pushItem = (item: {
      key: string
      name: string
      url: string
      source: 'attachment' | 'answer'
      questionLabel?: string
      type?: string
      isImage: boolean
    }) => {
      if (!item.url) {
        return
      }

      const dedupe = `${item.url}|${item.source === 'answer' ? item.questionLabel || '' : item.key}`
      if (seen.has(dedupe)) {
        return
      }
      seen.add(dedupe)

      if (item.isImage) {
        imageItems.push({
          key: item.key,
          name: item.name,
          url: item.url,
          source: item.source,
          questionLabel: item.questionLabel,
          type: item.type
        })
      } else {
        fileItems.push({
          key: item.key,
          name: item.name,
          url: item.url,
          type: item.type
        })
      }
    }

    selectedReport.attachments?.forEach((attachment, index) => {
      if (!attachment) {
        return
      }

      const url = typeof attachment === 'string' ? attachment : attachment.url
      if (!url) {
        return
      }

      const filename =
        typeof attachment === 'string'
          ? `Attachment ${index + 1}`
          : attachment.filename || attachment.id || `Attachment ${index + 1}`
      const type =
        typeof attachment === 'string'
          ? undefined
          : attachment.type

      pushItem({
        key: `attachment-${typeof attachment === 'string' ? index : attachment.id || index}`,
        name: filename,
        url,
        source: 'attachment',
        type,
        questionLabel: undefined,
        isImage: type === 'photo' || isImageUrl(url)
      })
    })

    selectedReport.answers?.forEach((answer, answerIndex) => {
      if (!Array.isArray(answer?.photos) || answer.photos.length === 0) {
        return
      }

      const rawQuestionLabel = formatQuestionLabel(answer?.questionId || `question ${answerIndex + 1}`)
      const questionLabel =
        rawQuestionLabel.charAt(0).toUpperCase() + rawQuestionLabel.slice(1)

      answer.photos.forEach((photoUrl, photoIndex) => {
        if (!photoUrl) {
          return
        }

        pushItem({
          key: `answer-photo-${answerIndex}-${photoIndex}`,
          name: `Answer ${answerIndex + 1} photo ${photoIndex + 1}`,
          url: photoUrl,
          source: 'answer',
          questionLabel,
          type: 'photo',
          isImage: true
        })
      })
    })

    return {
      images: imageItems,
      files: fileItems,
      hasMedia: imageItems.length > 0 || fileItems.length > 0
    }
  }, [selectedReport])

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
    setTripFilter('all')
  }, [selectedFeederKey])

  useEffect(() => {
    setFeederAiSummary(null)
    setFeederGeneratingAI(false)
    setFeederQuestionChartData([])
  }, [selectedFeederKey, startDateInput, endDateInput, tripFilter])

  const tripOptions = useMemo(() => {
    if (!selectedFeederSummary) {
      return []
    }
    const numericTrips = new Set<string>()
    let hasUnspecified = false

    selectedFeederSummary.reports.forEach(report => {
      if (isUnspecifiedTripNumber(report.tripNumber)) {
        hasUnspecified = true
      } else {
        numericTrips.add(String(report.tripNumber))
      }
    })

    const sorted = Array.from(numericTrips).sort((a, b) => {
      const numA = Number(a)
      const numB = Number(b)
      if (Number.isNaN(numA) || Number.isNaN(numB)) {
        return a.localeCompare(b)
      }
      return numA - numB
    })

    if (hasUnspecified) {
      sorted.push(UNSPECIFIED_TRIP_VALUE)
    }

    return sorted
  }, [selectedFeederSummary])

  const filteredFeederReports = useMemo(() => {
    if (!selectedFeederSummary) {
      return []
    }
    if (tripFilter === 'all') {
      return selectedFeederSummary.reports
    }
    if (tripFilter === UNSPECIFIED_TRIP_VALUE) {
      return selectedFeederSummary.reports.filter(report => isUnspecifiedTripNumber(report.tripNumber))
    }
    return selectedFeederSummary.reports.filter(report => String(report.tripNumber) === tripFilter)
  }, [selectedFeederSummary, tripFilter])

  const feederAggregate = useMemo(() => {
    if (!selectedFeederSummary) {
      return { total: 0, approved: 0, rejected: 0, pending: 0, requiresAction: 0, uniqueEmployees: 0 }
    }

    const reports = filteredFeederReports
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
  }, [selectedFeederSummary, filteredFeederReports])

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
    filteredFeederReports.forEach(report => {
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
  }, [selectedFeederSummary, filteredFeederReports])

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

    const reportsToSummarize = filteredFeederReports
    const questionStats = buildQuestionStats(reportsToSummarize)
    setFeederQuestionChartData(questionStats)
    const questionLines = questionStats.map(
      stat => `For "${stat.name}": ${stat.yes} reports answered 'yes' and ${stat.no} reports answered 'no'.`
    )
    const numericSummarySection =
      questionStats.length > 0
        ? `Numerical Summary of Key Questions:\n${questionLines.join('\n')}`
        : reportsToSummarize.length
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
        rawReports: reportsToSummarize
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

    const filterLabel =
      tripFilter === 'all'
        ? 'All trips'
        : tripFilter === UNSPECIFIED_TRIP_VALUE
          ? 'Unspecified trip'
          : `Trip ${tripFilter}`

    const questionLines = feederQuestionChartData.map(
      stat => `For "${stat.name}": ${stat.yes} reports answered 'yes' and ${stat.no} reports answered 'no'.`
    )
    const numericSummarySection =
      questionLines.length > 0 ? `Numerical Summary of Key Questions:\n${questionLines.join('\n')}` : ''

    const statusLines = feederStatusData.map(
      stat => `- ${stat.name}: ${stat.value} report${stat.value === 1 ? '' : 's'}`
    )
    const tripLines = feederTripData.map(
      stat => `- ${stat.name}: ${stat.value} report${stat.value === 1 ? '' : 's'}`
    )

    const headlineSection = [
      `Feeder Point: ${selectedFeederSummary.feederPointName || 'Unknown'}`,
      `Date Range: ${startDateInput} to ${endDateInput}`,
      `Trip Filter: ${filterLabel}`,
      `Total Reports: ${feederAggregate.total}`,
      `Approved: ${feederAggregate.approved}`,
      `Rejected: ${feederAggregate.rejected}`,
      `Pending: ${feederAggregate.pending}`,
      `Requires Action: ${feederAggregate.requiresAction}`,
      `Unique Employees: ${feederAggregate.uniqueEmployees}`
    ].join('\n')

    const textSegments = [
      headlineSection,
      feederAiSummary && feederAiSummary.trim(),
      !feederAiSummary?.includes('Numerical Summary of Key Questions') ? numericSummarySection : '',
      statusLines.length > 0 ? `Status Breakdown:\n${statusLines.join('\n')}` : '',
      tripLines.length > 0 ? `Trip Distribution:\n${tripLines.join('\n')}` : ''
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900">Employee Activity</h2>
          <p className="text-sm text-gray-500 mb-4">
            Click a team member to inspect their report history within the selected date range.
          </p>

          <div className="mt-6 max-h-96 overflow-x-auto overflow-y-auto">
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
          <div className="card">
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
    {feederSummaries.length > 0 && (
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1 text-sm font-medium shadow-sm">
            <button
              type="button"
              onClick={() => setBestWorstMode('range')}
              className={`rounded-md px-3 py-1 transition ${
                feederInsightsMode === 'range'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Date range
            </button>
            <button
              type="button"
              onClick={() => setBestWorstMode('single')}
              className={`rounded-md px-3 py-1 transition ${
                feederInsightsMode === 'single'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Single day
            </button>
          </div>
          {feederInsightsMode === 'single' && (
            <div className="flex flex-col gap-1 text-sm text-gray-600 sm:flex-row sm:items-center sm:gap-2">
              <label className="font-medium text-gray-700" htmlFor="best-worst-day">
                Day to analyse
              </label>
              <input
                id="best-worst-day"
                type="date"
                value={bestWorstSingleDayInput}
                onChange={event => setBestWorstSingleDayInput(event.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min={startDateInput || undefined}
                max={endDateInput || undefined}
              />
            </div>
          )}
        </div>
        {hasFeederInsights ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {bestFeederInsight && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        Best Feeder Point
                      </p>
                      <p className="text-lg font-semibold text-gray-900">{bestFeederInsight.feederPointName}</p>
                      <p className="text-xs text-gray-500">
                        {feederInsightsMode === 'single'
                          ? `Performance on ${bestWorstSingleDayLabel || 'selected day'}`
                          : 'Across current date range'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Approval rate</p>
                    <p className="text-base font-semibold text-gray-900">
                      {formatPercent(bestFeederInsight.approvalRate)}
                    </p>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Total reports</dt>
                    <dd className="font-semibold text-gray-900">{bestFeederInsight.totalReports}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Approved</dt>
                    <dd className="font-semibold text-emerald-600">{bestFeederInsight.approvedReports}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Rejected</dt>
                    <dd className="font-semibold text-red-600">{bestFeederInsight.rejectedReports}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Pending / action</dt>
                    <dd className="font-semibold text-amber-600">{bestFeederInsight.pendingReports}</dd>
                  </div>
                </dl>
                {bestFeederInsight.lastReportAt && (
                  <p className="mt-4 text-xs text-gray-500">
                    Last submission: {bestFeederInsight.lastReportAt.toLocaleString()}
                  </p>
                )}
              </div>
            )}
            {worstFeederInsight && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-rose-50 p-2 text-rose-600">
                      <TrendingDown className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                        Needs Attention
                      </p>
                      <p className="text-lg font-semibold text-gray-900">{worstFeederInsight.feederPointName}</p>
                      <p className="text-xs text-gray-500">
                        {feederInsightsMode === 'single'
                          ? `Performance on ${bestWorstSingleDayLabel || 'selected day'}`
                          : 'Across current date range'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Approval rate</p>
                    <p className="text-base font-semibold text-gray-900">
                      {formatPercent(worstFeederInsight.approvalRate)}
                    </p>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Total reports</dt>
                    <dd className="font-semibold text-gray-900">{worstFeederInsight.totalReports}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Approved</dt>
                    <dd className="font-semibold text-emerald-600">{worstFeederInsight.approvedReports}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Rejected</dt>
                    <dd className="font-semibold text-red-600">{worstFeederInsight.rejectedReports}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Pending / action</dt>
                    <dd className="font-semibold text-amber-600">{worstFeederInsight.pendingReports}</dd>
                  </div>
                </dl>
                {worstFeederInsight.lastReportAt && (
                  <p className="mt-4 text-xs text-gray-500">
                    Last submission: {worstFeederInsight.lastReportAt.toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
            {feederInsightsMode === 'single'
              ? 'No feeder point activity for the selected day.'
              : 'No feeder point performance insights for this date range.'}
          </div>
        )}
        {onlyOneFeeder && hasFeederInsights && (
          <p className="text-xs text-gray-500">
            Only one feeder point has activity for this selection.
          </p>
        )}
      </div>
    )}

    <div className="max-h-96 overflow-x-auto overflow-y-auto">
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

          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Feeder Point Reports</h2>
                <p className="text-sm text-gray-500">
                  Select a feeder point to inspect all submissions within the chosen dates.
                </p>
              </div>
              {selectedFeederSummary && (
                <div className="text-sm text-gray-600">
                  {filteredFeederReports.length} of {selectedFeederSummary.reports.length} report
                  {selectedFeederSummary.reports.length === 1 ? '' : 's'} in view
                </div>
              )}
            </div>

            {!selectedFeederSummary ? (
              <p className="mt-4 text-sm text-gray-500">
                Choose a feeder point from the list to view its submitted reports.
              </p>
            ) : (
              <>
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedFeederSummary.feederPointName}</p>
                      <p className="text-xs text-gray-500">
                        {feederAggregate.total} report{feederAggregate.total === 1 ? '' : 's'} | {feederAggregate.uniqueEmployees}{' '}
                        contributor{feederAggregate.uniqueEmployees === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                      {tripOptions.length > 0 && (
                        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-2">
                          <label className="font-medium text-gray-700" htmlFor="trip-filter">
                            Trip filter
                          </label>
                          <select
                            id="trip-filter"
                            value={tripFilter}
                            onChange={event => setTripFilter(event.target.value)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="all">All trips</option>
                            {tripOptions.map(option => (
                              <option key={option} value={option}>
                                {option === UNSPECIFIED_TRIP_VALUE ? 'Unspecified trip' : `Trip ${option}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
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
                  </div>
                </div>

                {(feederAiSummary || feederQuestionChartData.length > 0) && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-6">
                    {feederAiSummary && (
                      <>
                        <h3 className="text-sm font-semibold text-gray-900">Concise Summary</h3>
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">{feederAiSummary}</pre>
                      </>
                    )}

                    {feederQuestionChartData.length > 0 && (
                      <div className="space-y-4">
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
                        />
                      </div>
                    )}

                    {feederAggregate.total > 0 && (
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="text-sm font-semibold text-gray-900 mb-4">Status Breakdown</h3>
                          <StatusPieChart data={feederStatusData} />
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="text-sm font-semibold text-gray-900 mb-4">Trips Distribution</h3>
                          <SimpleBarChart data={feederTripData} />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleDownloadFeederSummary}
                      disabled={feederGeneratingAI || (feederAggregate.total === 0 && !feederAiSummary && feederQuestionChartData.length === 0)}
                      className="btn-secondary flex w-full items-center justify-center space-x-2 px-3 py-2 disabled:opacity-60"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Summary</span>
                    </button>
                  </div>
                )}

                <div className="mt-6 max-h-96 overflow-x-auto overflow-y-auto">
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
                          View
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredFeederReports.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                            No reports match the current trip filter.
                          </td>
                        </tr>
                      ) : (
                        filteredFeederReports.map(report => {
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
                              <td className="px-4 py-3 text-sm">
                                <button
                                  type="button"
                                  onClick={() => setSelectedReport(report)}
                                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 focus:outline-none"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>View</span>
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      <Transition.Root show={Boolean(selectedReport)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedReport(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="absolute right-4 top-4 text-gray-400 transition hover:text-gray-600 focus:outline-none"
                  >
                    <span className="sr-only">Close</span>
                    <XCircle className="h-5 w-5" />
                  </button>

                  {selectedReport && selectedReportMeta && (
                    <div>
                      <Dialog.Title className="text-2xl font-semibold text-gray-900">
                        {selectedReport.feederPointName || 'Feeder Point Report'}
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-gray-500">
                        Submitted by {selectedReport.userName || selectedReport.submittedBy || 'Unknown'} ·{' '}
                        {selectedReportMeta.submittedAt
                          ? selectedReportMeta.submittedAt.toLocaleString()
                          : 'Unknown date'}
                      </p>

                      <div className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium uppercase text-gray-500">Status</p>
                          <p className="mt-1">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${selectedReportMeta.badgeColor}`}
                            >
                              {selectedReportMeta.status.replace('_', ' ')}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-gray-500">Trip</p>
                          <p className="mt-1 text-gray-900">
                            {selectedReport.tripNumber ? `Trip ${selectedReport.tripNumber}` : 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-gray-500">Feeder point</p>
                          <p className="mt-1 text-gray-900">
                            {selectedReport.feederPointName || 'N/A'}
                            {selectedReport.feederPointId ? ` · ${selectedReport.feederPointId}` : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-gray-500">Team / Employee</p>
                          <p className="mt-1 text-gray-900">
                            {selectedReport.teamName ? `${selectedReport.teamName} · ` : ''}
                            {selectedReport.userName || selectedReport.submittedBy || 'Unknown'}
                          </p>
                        </div>
                        {selectedReport.submittedLocation?.address && (
                          <div className="sm:col-span-2">
                            <p className="text-xs font-medium uppercase text-gray-500">Submitted location</p>
                            <p className="mt-1 text-gray-900">{selectedReport.submittedLocation.address}</p>
                          </div>
                        )}
                      </div>

                      {selectedReport.description && (
                        <div className="mt-6">
                          <h3 className="text-sm font-semibold text-gray-900">Summary</h3>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                            {selectedReport.description}
                          </p>
                        </div>
                      )}

                      {Array.isArray(selectedReport.answers) && selectedReport.answers.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-sm font-semibold text-gray-900">Responses</h3>
                          <div className="mt-3 space-y-3">
                            {selectedReport.answers.map((answer, index) => {
                              const label =
                                typeof answer?.questionId === 'string'
                                  ? answer.questionId
                                  : answer?.description || `Question ${index + 1}`
                              const value =
                                typeof answer?.answer === 'string'
                                  ? answer.answer
                                  : answer?.answer === undefined || answer?.answer === null
                                    ? 'N/A'
                                    : JSON.stringify(answer.answer)
                              return (
                                <div key={`${label}-${index}`} className="rounded-lg border border-gray-200 p-3">
                                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{value}</p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-6 space-y-5">
                        {reportMedia.images.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Photos</h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {reportMedia.images.map(item => (
                                <div key={item.key} className="flex flex-col rounded-lg border border-gray-200 p-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewImage({
                                        url: item.url,
                                        name: item.questionLabel
                                          ? `${item.name} – ${item.questionLabel}`
                                          : item.name
                                      })
                                    }
                                    className="overflow-hidden rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  >
                                    <img
                                      src={item.url}
                                      alt={item.name}
                                      className="h-40 w-full object-cover"
                                      loading="lazy"
                                    />
                                  </button>
                                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                                    <p className="font-semibold text-gray-900">{item.name}</p>
                                    {item.source === 'answer' && item.questionLabel && (
                                      <p className="text-gray-500">Question: {item.questionLabel}</p>
                                    )}
                                  </div>
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                                  >
                                    Open original
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {reportMedia.files.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Files</h3>
                            <ul className="space-y-2 text-sm">
                              {reportMedia.files.map(item => (
                                <li
                                  key={item.key}
                                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                                >
                                  <div>
                                    <p className="font-medium text-gray-900">{item.name}</p>
                                    {item.type && (
                                      <p className="text-xs uppercase tracking-wide text-gray-500">{item.type}</p>
                                    )}
                                  </div>
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-indigo-600 hover:underline"
                                  >
                                    Open
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {!reportMedia.hasMedia && (
                          <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                            No attachments or photos found for this report.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={Boolean(previewImage)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setPreviewImage(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-black/90 p-4 text-left align-middle shadow-2xl transition-all sm:p-6">
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Close image preview</span>
                    <XCircle className="h-5 w-5" />
                  </button>

                  {previewImage && (
                    <div className="space-y-4">
                      <Dialog.Title className="text-lg font-semibold text-white">
                        {previewImage.name}
                      </Dialog.Title>
                      <div className="relative">
                        <img
                          src={previewImage.url}
                          alt={previewImage.name}
                          className="max-h-[70vh] w-full rounded-lg object-contain cursor-zoom-out"
                          onClick={() => setPreviewImage(null)}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm text-white/80">
                        <span>Click the image to close.</span>
                        <a
                          href={previewImage.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-indigo-300 hover:text-indigo-200"
                        >
                          Open original in new tab
                        </a>
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

    </>
  )
}
