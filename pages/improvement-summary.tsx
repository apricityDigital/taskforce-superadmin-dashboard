import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import {
  Activity,
  BarChart3,
  Camera,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  Percent,
  RefreshCcw,
  Sparkles,
  Trash2,
  Filter,
  ArrowUpDown,
  X,
  ZoomIn
} from 'lucide-react'
import { DataService, ComplianceReport } from '@/lib/dataService'

type FeederInsight = {
  key: string
  feederPointId?: string
  name: string
  totalReports: number
  approved: number
  rejected: number
  pending: number
  photos: number
  yesAnswers: number
  noAnswers: number
  latestDate: Date | null
  improvementPercent: number
  rationale: string
  aiValidatedApproved: number
  aiFlagged: number
  shareOfTotal: number
  transformationScore: number
  beforeImages: string[]
  afterImages: string[]
  beforeDate: Date | null
  afterDate: Date | null
  improvementNotes: string[]
}

const toDateInputValue = (date: Date) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy.toISOString().slice(0, 10)
}

const normaliseDate = (value: any): Date | null => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
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

export default function ImprovementSummaryPage() {
  const [reports, setReports] = useState<ComplianceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [startDateInput, setStartDateInput] = useState(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 30)
    return toDateInputValue(start)
  })
  const [endDateInput, setEndDateInput] = useState(() => toDateInputValue(new Date()))
  const [quickRange, setQuickRange] = useState<'7d' | '30d' | '90d' | 'all' | 'custom'>('30d')
  const [feederFilter, setFeederFilter] = useState<'all' | 'top' | 'needs_attention'>('all')
  const [hiddenFeederKeys, setHiddenFeederKeys] = useState<Set<string>>(new Set())
  const [reviewFeederKey, setReviewFeederKey] = useState<string | null>(null)
  const [reviewQueue, setReviewQueue] = useState<ComplianceReport[]>([])
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null)
  const [selectedReviewImage, setSelectedReviewImage] = useState<string | null>(null)
  const [expandedRationale, setExpandedRationale] = useState<Record<string, boolean>>({})
  const [transformationView, setTransformationView] = useState<{
    feederName: string
    before: string[]
    after: string[]
    beforeDate: Date | null
    afterDate: Date | null
  } | null>(null)
  const [deletingFeederKey, setDeletingFeederKey] = useState<string | null>(null)
  const [improvementModal, setImprovementModal] = useState<{ name: string; percent: number; notes: string[] } | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await DataService.getAllComplianceReports()
        setReports(data)
      } catch (error) {
        console.error('Failed to load reports for improvement summary:', error)
        setReports([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

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

  const filteredReports = useMemo(() => {
    if (dateError) return []

    return reports.filter(report => {
      const reportDate = resolveReportDate(report)
      if (!reportDate) return false
      if (startDate && reportDate < startDate) return false
      if (endDate && reportDate > endDate) return false
      return true
    })
  }, [reports, startDate, endDate, dateError])

  const aggregate = useMemo(() => {
    let photos = 0
    let answeredQuestions = 0
    let totalResponses = filteredReports.length
    let earliest: Date | null = null
    let latest: Date | null = null

    filteredReports.forEach(report => {
      answeredQuestions += report.answers ? report.answers.length : 0

      if (report.answers) {
        report.answers.forEach(answer => {
          if (answer.photos && answer.photos.length > 0) {
            photos += answer.photos.length
          }
        })
      }

      if (report.attachments && report.attachments.length > 0) {
        photos += report.attachments.filter(att => att.type === 'photo').length
      }

      const reportDate = resolveReportDate(report)
      if (reportDate) {
        if (!earliest || reportDate < earliest) earliest = reportDate
        if (!latest || reportDate > latest) latest = reportDate
      }
    })

    return { photos, answeredQuestions, totalResponses, earliest, latest }
  }, [filteredReports])

  const collectReportImages = (report: ComplianceReport) => {
    const answerPhotos = report.answers?.flatMap(ans => ans.photos || []) || []
    const attachmentPhotos = (report.attachments || [])
      .filter(att => att.type === 'photo')
      .map(att => att.url)
    return [...answerPhotos, ...attachmentPhotos]
  }

  const { feederInsights, flaggedMap } = useMemo(() => {
    const map = new Map<string, Omit<FeederInsight, 'improvementPercent' | 'rationale' | 'transformationScore'>>()
    const flaggedByFeeder = new Map<string, ComplianceReport[]>()

    filteredReports.forEach(report => {
      const key = report.feederPointId || report.feederPointName || report.id
      if (!map.has(key)) {
        map.set(key, {
          key,
          feederPointId: report.feederPointId,
          name: report.feederPointName || 'Unspecified Feeder Point',
          totalReports: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          photos: 0,
          yesAnswers: 0,
          noAnswers: 0,
          latestDate: null,
          aiValidatedApproved: 0,
          aiFlagged: 0,
          shareOfTotal: 0,
          beforeImages: [],
          afterImages: [],
          beforeDate: null,
          afterDate: null,
          improvementNotes: []
        })
      }

      const entry = map.get(key)!
      entry.totalReports += 1
      if (report.status === 'approved') entry.approved += 1
      else if (report.status === 'rejected') entry.rejected += 1
      else entry.pending += 1

      let yesCount = 0
      let noCount = 0
      let photoCount = 0

      if (report.answers) {
        report.answers.forEach(answer => {
          const raw = (answer.answer || '').toString().trim().toLowerCase()
          if (raw === 'yes' || raw === 'y' || raw === 'true' || raw === '1') {
            entry.yesAnswers += 1
            yesCount += 1
          }
          if (raw === 'no' || raw === 'n' || raw === 'false' || raw === '0') {
            entry.noAnswers += 1
            noCount += 1
          }
          if (answer.photos && answer.photos.length > 0) {
            entry.photos += answer.photos.length
            photoCount += answer.photos.length
          }
        })
      }

      if (report.attachments && report.attachments.length > 0) {
        const attachmentPhotos = report.attachments.filter(att => att.type === 'photo').length
        entry.photos += attachmentPhotos
        photoCount += attachmentPhotos
      }
      const allPhotos = collectReportImages(report)

      const sentimentDenominator = yesCount + noCount
      const sentimentScore = sentimentDenominator ? yesCount / sentimentDenominator : 0.5
      const photoBoost = photoCount > 0 ? 0.1 : 0
      const aiConfidence = sentimentScore * 0.7 + photoBoost
      if (aiConfidence >= 0.55) {
        entry.aiValidatedApproved += 1
      } else if (aiConfidence <= 0.35 && report.status !== 'approved') {
        entry.aiFlagged += 1
        if (!flaggedByFeeder.has(key)) {
          flaggedByFeeder.set(key, [])
        }
        flaggedByFeeder.get(key)!.push(report)
      }

      const reportDate = resolveReportDate(report)
      if (reportDate && (!entry.latestDate || reportDate > entry.latestDate)) {
        entry.latestDate = reportDate
      }
      if (reportDate && allPhotos.length > 0) {
        if (!entry.beforeDate || reportDate < entry.beforeDate) {
          entry.beforeDate = reportDate
          entry.beforeImages = allPhotos.slice(0, 8)
        }
        if (!entry.afterDate || reportDate > entry.afterDate) {
          entry.afterDate = reportDate
          entry.afterImages = allPhotos.slice(0, 8)
        }
      }
    })

    const result: FeederInsight[] = []
    map.forEach(entry => {
      const approvalScore = entry.totalReports ? entry.approved / entry.totalReports : 0
      const sentimentDenominator = entry.yesAnswers + entry.noAnswers
      const sentimentScore = sentimentDenominator ? entry.yesAnswers / sentimentDenominator : 0.5
      const photoWeight = entry.photos > 0 ? 0.1 : 0
      const blended = approvalScore * 0.6 + sentimentScore * 0.3 + photoWeight
      const improvementPercent = Math.min(100, Math.max(0, Math.round(blended * 100)))
      const photoImpact = Math.min(20, Math.log10(entry.photos + 1) * 15)
      // const recencyBoost = entry.latestDate
      //   ? (() => {
      //       const days = Math.max(0, (Date.now() - entry.latestDate.getTime()) / (1000 * 60 * 60 * 24))
      //       if (days <= 14) return 10
      //       if (days <= 45) return 5
      //       return 0
      //     })()
      //   : 0
      const baseTransformation = improvementPercent + photoImpact - entry.aiFlagged * 5 - entry.rejected * 2 - entry.pending
      const cleanSweep =
        improvementPercent >= 90 && entry.aiFlagged === 0 && entry.rejected === 0 && entry.pending === 0
      const transformationScore = cleanSweep
        ? 100
        : Math.max(0, Math.min(95, Math.round(baseTransformation)))
      const aiVerified = Math.max(entry.aiValidatedApproved, entry.totalReports - entry.aiFlagged)

      const rationaleParts: string[] = []
      rationaleParts.push(
        `${entry.totalReports} reports with ${Math.round(approvalScore * 100)}% approvals.`
      )
      if (entry.photos > 0) {
        rationaleParts.push(`${entry.photos} photo${entry.photos === 1 ? '' : 's'} reviewed as evidence.`)
      }
      if (sentimentDenominator) {
        rationaleParts.push(
          `Answers: ${entry.yesAnswers} positive vs ${entry.noAnswers} negative.`
        )
      }
      if (entry.rejected > 0) {
        rationaleParts.push(`Open issues: ${entry.rejected} rejection${entry.rejected === 1 ? '' : 's'}.`)
      } else if (entry.pending > 0) {
        rationaleParts.push(`${entry.pending} submission${entry.pending === 1 ? '' : 's'} awaiting review.`)
      }
      if (aiVerified > 0) {
        rationaleParts.push(`AI confirmed ${aiVerified} submission${aiVerified === 1 ? '' : 's'}.`)
      }
      if (entry.aiFlagged > 0) {
        rationaleParts.push(`AI flagged ${entry.aiFlagged} for manual inspection.`)
      }

      const improvementNotes = [
        `Approvals are strong: ${Math.round(approvalScore * 100)}% of reports got approved.`,
        `People mostly said "yes": ${entry.yesAnswers} yes answers and ${entry.noAnswers} no answers (about ${Math.round(sentimentScore * 100)}% positive).`,
        entry.photos > 0
          ? `${entry.photos} photo${entry.photos === 1 ? '' : 's'} show the place, helping the score.`
          : 'No photos were shared, so the score relies on answers only.',
        entry.aiFlagged > 0 ? `${entry.aiFlagged} report${entry.aiFlagged === 1 ? '' : 's'} need human recheck.` : 'Nothing is waiting for a human recheck.'
      ].filter((note): note is string => note !== undefined)

      result.push({
        ...entry,
        aiValidatedApproved: aiVerified,
        improvementPercent,
        transformationScore,
        rationale: rationaleParts.join(' '),
        improvementNotes
      })
    })

    const totalReports = filteredReports.length || 1
    result.forEach(item => {
      item.shareOfTotal = Math.round((item.totalReports / totalReports) * 100)
    })

    let filtered = result
    if (feederFilter === 'top') {
      filtered = result.filter(item => item.improvementPercent >= 70)
    } else if (feederFilter === 'needs_attention') {
      filtered = result.filter(item => item.improvementPercent < 40 || item.aiFlagged > 0 || item.rejected > item.approved)
    }

    const sorted = filtered
      .filter(item => !hiddenFeederKeys.has(item.key))
      .sort((a, b) => b.transformationScore - a.transformationScore || b.improvementPercent - a.improvementPercent)

    return { feederInsights: sorted, flaggedMap: flaggedByFeeder }
  }, [filteredReports, feederFilter, hiddenFeederKeys])

  const summaryTitle = useMemo(() => {
    if (dateError) return 'Resolve date filters to view impact.'
    if (filteredReports.length === 0) return 'No reports in this date range.'
    const startLabel = startDate ? startDate.toLocaleDateString() : ''
    const endLabel = endDate ? endDate.toLocaleDateString() : ''
    return `Impact from ${startLabel} to ${endLabel}`
  }, [dateError, filteredReports.length, startDate, endDate])

  const setQuickRangeDates = (range: '7d' | '30d' | '90d' | 'all') => {
    const today = new Date()
    const end = toDateInputValue(today)
    let start = ''
    if (range === 'all') {
      start = '2000-01-01'
    } else {
      const d = new Date()
      const delta = range === '7d' ? 7 : range === '30d' ? 30 : 90
      d.setDate(d.getDate() - delta)
      start = toDateInputValue(d)
    }
    setQuickRange(range)
    setStartDateInput(start)
    setEndDateInput(end)
  }

  const handleDeleteFeeder = async (insightKey: string, name: string, feederPointId?: string) => {
    const confirmation = window.prompt(
      `Type "I know what I am doing" to permanently remove feeder point "${name}" from this view.`
    )
    if (confirmation === 'I know what I am doing') {
      try {
        setDeletingFeederKey(insightKey)
        await DataService.deleteFeederPointAndReports(feederPointId, name)
        setHiddenFeederKeys(prev => new Set(prev).add(insightKey))
      } catch (error) {
        console.error('Failed to delete feeder point:', error)
        alert('Could not delete this feeder point right now. Please try again.')
      } finally {
        setDeletingFeederKey(null)
      }
    }
  }

  const openFlaggedReview = (key: string) => {
    const list = (flaggedMap.get(key) || []).slice().sort((a, b) => {
      const aDate = resolveReportDate(a)?.getTime() || 0
      const bDate = resolveReportDate(b)?.getTime() || 0
      return bDate - aDate
    })
    setReviewFeederKey(key)
    setReviewQueue(list)
  }

  const handleReviewUpdate = async (reportId: string, status: 'approved' | 'rejected') => {
    try {
      setUpdatingReportId(reportId)
      await DataService.updateComplianceReportStatus(reportId, status)
      setReports(prev => prev.map(r => (r.id === reportId ? { ...r, status } : r)))
      setReviewQueue(prev => prev.filter(r => r.id !== reportId))
    } catch (error) {
      console.error('Failed to update report status during review:', error)
      alert('Could not update this report right now. Please try again.')
    } finally {
      setUpdatingReportId(null)
    }
  }

  return (
    <>
      <Head>
        <title>Improvement Summary | Super Admin Dashboard</title>
      </Head>

      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Historical Impact</p>
            <h1 className="text-3xl font-extrabold text-gray-900">Improvement & Evidence Overview</h1>
            <p className="text-sm text-gray-600 max-w-3xl">
              Date-filtered rollup of submissions, photo evidence, answered questions, and AI-styled improvement insights.
            </p>
          </div>

        </div>

        <div className="rounded-2xl border border-slate-100 bg-white shadow-lg p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Date window</p>
              <p className="text-xs text-gray-500">Tune the range to adjust calculations and AI insights.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {(['7d', '30d', '90d', 'all'] as const).map(range => (
                <button
                  key={`inline-${range}`}
                  onClick={() => setQuickRangeDates(range)}
                  className={`px-3 py-2 rounded-lg border ${quickRange === range
                      ? 'border-indigo-500 text-indigo-700 bg-indigo-50'
                      : 'border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700'
                    }`}
                >
                  {range === 'all' ? 'All time' : `Last ${range.replace('d', '')} days`}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-1">Start date</label>
                <input
                  type="date"
                  value={startDateInput}
                  max={endDateInput}
                  onChange={event => {
                    setQuickRange('custom')
                    setStartDateInput(event.target.value)
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-1">End date</label>
                <input
                  type="date"
                  value={endDateInput}
                  min={startDateInput}
                  onChange={event => {
                    setQuickRange('custom')
                    setEndDateInput(event.target.value)
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
          {dateError && <p className="mt-3 text-sm text-red-600">{dateError}</p>}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-white shadow-lg flex items-center justify-center gap-3 p-6">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <p className="text-sm text-gray-700">Loading improvement summary...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-white shadow-lg flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-gray-500">Photos submitted</p>
                  <p className="text-2xl font-semibold text-gray-900">{aggregate.photos}</p>
                </div>
                <Camera className="h-10 w-10 text-indigo-500" />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white shadow-lg flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-gray-500">Questions answered</p>
                  <p className="text-2xl font-semibold text-gray-900">{aggregate.answeredQuestions}</p>
                </div>
                <Activity className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white shadow-lg flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-gray-500">Responses completed</p>
                  <p className="text-2xl font-semibold text-gray-900">{aggregate.totalResponses}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-amber-500" />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white shadow-lg flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-gray-500">Coverage window</p>
                  <p className="text-base font-semibold text-gray-900">
                    {aggregate.earliest ? aggregate.earliest.toLocaleDateString() : '--'} to{' '}
                    {aggregate.latest ? aggregate.latest.toLocaleDateString() : '--'}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-slate-500" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white shadow-lg p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">AI Improvement Insight</p>
                  <h2 className="text-xl font-semibold text-gray-900">{summaryTitle}</h2>
                  <p className="text-sm text-gray-600">
                    Blended approval, answer sentiment, and photo evidence to estimate percentage improvement by feeder point.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2 text-sm">
                    <Filter className="h-4 w-4 text-indigo-500" />
                    <select
                      value={feederFilter}
                      onChange={event => setFeederFilter(event.target.value as typeof feederFilter)}
                      className="rounded-md border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All feeder points</option>
                      <option value="top">Top performers (>=70%)</option>
                      <option value="needs_attention">Needs attention (&lt;40% or flagged)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    <span>Auto re-verification via answers + photos</span>
                  </div>
                </div>
              </div>

              {filteredReports.length === 0 ? (
                <p className="mt-4 text-sm text-gray-600">No submissions found for the selected dates.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Feeder Point</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Reports</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Photos</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">% of total</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Transformation</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">% Improvement</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">AI Checks</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">AI Rationale</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Latest</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          <ArrowUpDown className="h-4 w-4 inline mr-1" />
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {feederInsights.map((insight, index) => {
                        const needsAttention =
                          insight.improvementPercent < 40 || insight.aiFlagged > 0 || insight.rejected > insight.approved
                        return (
                          <tr
                            key={insight.key}
                            className={`transition-colors ${needsAttention ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-indigo-50/40'}`}
                          >
                            <td className="px-4 py-3 text-sm font-semibold text-gray-800">{index + 1}</td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-900">{insight.name}</p>
                              <p className="text-xs text-gray-500">{insight.key}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              <div className="font-semibold">{insight.totalReports}</div>
                              <div className="text-xs text-gray-500">
                                {insight.approved} approved / {insight.pending} pending / {insight.rejected} rejected
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">{insight.photos}</td>
                            <td className="px-4 py-3 text-sm text-gray-800">{insight.shareOfTotal}%</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {insight.transformationScore}/100
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() =>
                                  setImprovementModal({
                                    name: insight.name,
                                    percent: insight.improvementPercent,
                                    notes: insight.improvementNotes
                                  })
                                }
                                className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 underline decoration-indigo-300 hover:decoration-indigo-700"
                              >
                                <Percent className="mr-1 h-3 w-3" />
                                {insight.improvementPercent}%
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              <div className="text-xs text-emerald-700 font-semibold">{insight.aiValidatedApproved} auto-confirmed</div>
                              <div className="text-xs text-red-700">{insight.aiFlagged} flagged for review</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                              {expandedRationale[insight.key]
                                ? insight.rationale
                                : `${insight.rationale.slice(0, 120)}${insight.rationale.length > 120 ? '…' : ''}`}
                              {insight.rationale.length > 120 && (
                                <button
                                  onClick={() =>
                                    setExpandedRationale(prev => ({
                                      ...prev,
                                      [insight.key]: !prev[insight.key]
                                    }))
                                  }
                                  className="ml-1 text-indigo-600 hover:text-indigo-800 text-xs font-semibold"
                                >
                                  {expandedRationale[insight.key] ? 'Read less' : 'Read more'}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {insight.latestDate ? insight.latestDate.toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => openFlaggedReview(insight.key)}
                                  disabled={insight.aiFlagged === 0}
                                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${insight.aiFlagged === 0
                                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                      : 'border-indigo-200 text-indigo-700 hover:border-indigo-400'
                                    }`}
                                >
                                  <Eye className="h-4 w-4" />
                                  Review AI-flagged ({insight.aiFlagged})
                                </button>
                                <button
                                  onClick={() =>
                                    setTransformationView({
                                      feederName: insight.name,
                                      before: insight.beforeImages,
                                      after: insight.afterImages,
                                      beforeDate: insight.beforeDate,
                                      afterDate: insight.afterDate
                                    })
                                  }
                                  disabled={insight.beforeImages.length === 0 && insight.afterImages.length === 0}
                                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${insight.beforeImages.length === 0 && insight.afterImages.length === 0
                                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                      : 'border-emerald-200 text-emerald-700 hover:border-emerald-400'
                                    }`}
                                >
                                  <Sparkles className="h-4 w-4" />
                                  View transformation
                                </button>
                                {/* <button
                                  onClick={() => handleDeleteFeeder(insight.key, insight.name, insight.feederPointId)}
                                  disabled={deletingFeederKey === insight.key}
                                  className={`inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs hover:border-red-400 hover:text-red-600 ${
                                    deletingFeederKey === insight.key ? 'opacity-60 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {deletingFeederKey === insight.key ? 'Deleting...' : 'Delete feeder point'}
                                </button> */}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card bg-gradient-to-r from-indigo-50 via-white to-emerald-50">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">How the AI-style scoring works</h3>
                  <p className="text-sm text-gray-700">
                    Improvement percentage blends approval rate (60%), answer sentiment (30%), and verified photo evidence (10%).
                    Rationale calls out approvals, open issues, and observed photo proof (e.g., garbage removed between trips).
                  </p>
                </div>
              </div>
            </div>

            {reviewFeederKey && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 py-8">
                <div className="bg-white w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-lg shadow-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500">AI flagged review</p>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Review flagged reports for {reviewFeederKey}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Approve or reject to clear them from the AI flagged list.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setReviewFeederKey(null)
                        setReviewQueue([])
                        setSelectedReviewImage(null)
                      }}
                      className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                      aria-label="Close review"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {reviewQueue.length === 0 ? (
                    <p className="text-sm text-gray-600">No flagged reports left for this feeder point.</p>
                  ) : (
                    <div className="space-y-3">
                      {reviewQueue.map(report => (
                        <div key={report.id} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {report.feederPointName || 'Feeder point'}
                              </p>
                              <p className="text-xs text-gray-500">Report ID: {report.id}</p>
                              <p className="text-xs text-gray-600">
                                Submitted by {report.userName || report.submittedBy || 'Unknown'} on{' '}
                                {resolveReportDate(report)?.toLocaleString() || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-600">
                                Status:{' '}
                                <span
                                  className={`px-2 py-1 rounded-full text-[11px] font-semibold ${report.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : report.status === 'rejected'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}
                                >
                                  {report.status}
                                </span>
                                {report.status === 'approved' && (
                                  <span className="ml-2 text-xs text-red-600 font-semibold">
                                    (Previously approved, AI suggests re-check)
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReviewUpdate(report.id, 'approved')}
                                disabled={updatingReportId === report.id}
                                className="btn-primary px-3 py-2 text-xs"
                              >
                                {updatingReportId === report.id ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleReviewUpdate(report.id, 'rejected')}
                                disabled={updatingReportId === report.id}
                                className="btn-secondary px-3 py-2 text-xs bg-red-500 hover:bg-red-600 text-white"
                              >
                                {updatingReportId === report.id ? 'Rejecting...' : 'Reject'}
                              </button>
                            </div>
                          </div>
                          {report.description && (
                            <p className="mt-2 text-sm text-gray-700">Summary: {report.description}</p>
                          )}
                          {report.answers && report.answers.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-semibold text-gray-700">Questions & Answers</p>
                              {report.answers.map((answer, idx) => (
                                <div key={`${report.id}-answer-${idx}`} className="rounded-md border border-gray-100 p-2 text-sm">
                                  <p className="font-semibold text-gray-900">{answer.description || answer.questionId || 'Question'}</p>
                                  <p className="text-gray-700">Answer: {answer.answer || 'N/A'}</p>
                                  {answer.notes && <p className="text-xs text-gray-500">Notes: {answer.notes}</p>}
                                  {answer.photos && answer.photos.length > 0 && (
                                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {answer.photos.map((url, photoIdx) => (
                                        <button
                                          key={`${report.id}-answer-${idx}-photo-${photoIdx}`}
                                          onClick={() => setSelectedReviewImage(url)}
                                          className="group relative overflow-hidden rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                          <img
                                            src={url}
                                            alt={`Answer photo ${photoIdx + 1}`}
                                            className="h-20 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {collectReportImages(report).length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Attached photos</p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {collectReportImages(report).map((url, idx) => (
                                  <button
                                    key={`${report.id}-img-${idx}`}
                                    onClick={() => setSelectedReviewImage(url)}
                                    className="group relative overflow-hidden rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  >
                                    <img
                                      src={url}
                                      alt={`Attachment ${idx + 1}`}
                                      className="h-24 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {selectedReviewImage && (
              <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
                <button
                  onClick={() => setSelectedReviewImage(null)}
                  className="absolute top-6 right-6 rounded-full bg-white/90 p-2 text-gray-800 shadow hover:bg-white"
                  aria-label="Close image preview"
                >
                  <X className="h-5 w-5" />
                </button>
                <img
                  src={selectedReviewImage}
                  alt="Flagged report attachment"
                  className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
                />
              </div>
            )}

            {transformationView && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 py-8">
                <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500">Transformation view</p>
                      <h3 className="text-xl font-semibold text-gray-900">{transformationView.feederName}</h3>
                      <p className="text-sm text-gray-600">
                        Before vs after snapshots help explain how the feeder point changed over time.
                      </p>
                    </div>
                    <button
                      onClick={() => setTransformationView(null)}
                      className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                      aria-label="Close transformation view"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900">Before</p>
                        <span className="text-xs text-gray-500">
                          {transformationView.beforeDate ? transformationView.beforeDate.toLocaleDateString() : 'No date'}
                        </span>
                      </div>
                      {transformationView.before.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {transformationView.before.map((url, idx) => (
                            <button
                              key={`before-${idx}`}
                              onClick={() => setSelectedReviewImage(url)}
                              className="group relative rounded-md overflow-hidden border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <img
                                src={url}
                                alt={`Before ${idx + 1}`}
                                className="h-32 w-full object-cover transition-transform duration-150 group-hover:scale-[1.03]"
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">No earlier photos found.</p>
                      )}
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3 bg-emerald-50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900">After</p>
                        <span className="text-xs text-gray-500">
                          {transformationView.afterDate ? transformationView.afterDate.toLocaleDateString() : 'No date'}
                        </span>
                      </div>
                      {transformationView.after.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {transformationView.after.map((url, idx) => (
                            <button
                              key={`after-${idx}`}
                              onClick={() => setSelectedReviewImage(url)}
                              className="group relative rounded-md overflow-hidden border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <img
                                src={url}
                                alt={`After ${idx + 1}`}
                                className="h-32 w-full object-cover transition-transform duration-150 group-hover:scale-[1.03]"
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">No recent photos found.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {improvementModal && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4 py-8">
                <div className="bg-white w-full max-w-xl rounded-lg shadow-2xl p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase font-semibold text-gray-500">Why this score</p>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {improvementModal.name}: {improvementModal.percent}%
                      </h3>
                    </div>
                    <button
                      onClick={() => setImprovementModal(null)}
                      className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                      aria-label="Close improvement details"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                    {improvementModal.notes.map((note, idx) => (
                      <li key={`improve-note-${idx}`}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
