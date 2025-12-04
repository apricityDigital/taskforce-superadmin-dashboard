import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import {
  Activity,
  BarChart3,
  Camera,
  CheckCircle,
  Clock,
  Download,
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

type AggregateSummary = {
  photos: number
  answeredQuestions: number
  totalResponses: number
  earliest: Date | null
  latest: Date | null
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

const REPORTS_START_DATE = new Date('2024-09-15T00:00:00')

const formatDateFolder = (date: Date) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy.toISOString().slice(0, 10)
}

const sanitizePathSegment = (value: string, fallback = 'report') => {
  const trimmed = (value || '').trim()
  const cleaned = trimmed
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .slice(0, 80)
  return cleaned || fallback
}

const inferFileExtension = (url: string, defaultExt = 'bin') => {
  try {
    const pathname = new URL(url).pathname
    const parts = pathname.split('.')
    const ext = parts.length > 1 ? parts.pop() : ''
    if (ext && ext.length <= 5) {
      return ext.toLowerCase()
    }
  } catch {
    // ignore parsing failures
  }
  return defaultExt
}

type AnswerSummaryForZip = {
  question: string
  answer: string
  notes?: string
  photos: string[]
}

type AttachmentSummaryForZip = {
  filename: string
  type: string
  originalName?: string
  error?: string
}

const DOWNLOAD_CONCURRENCY = 8
const ALLOWED_IMAGE_HOSTS = ['firebasestorage.googleapis.com']
const PDF_PHOTO_LIMIT = 12

const cleanText = (value: string | undefined | null) => {
  if (!value) return undefined
  return String(value)
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const buildReportNarrative = (
  report: ComplianceReport,
  reportDate: Date | null,
  answers: AnswerSummaryForZip[],
  attachments: AttachmentSummaryForZip[],
  failedAssets: string[]
) => {
  const lines: string[] = []
  const submittedAt = reportDate ? reportDate.toLocaleString() : 'Unknown'

  lines.push(`Report ID: ${report.id}`)
  lines.push(`Feeder Point: ${report.feederPointName || 'N/A'}`)
  lines.push(`Submitted By: ${report.userName || report.submittedBy || 'Unknown'}`)
  lines.push(`Team: ${report.teamName || 'N/A'}`)
  lines.push(`Trip: ${report.tripNumber ?? 'N/A'} on ${report.tripDate || 'N/A'}`)
  lines.push(`Submitted At: ${submittedAt}`)
  lines.push(`Status: ${report.status}`)
  lines.push(
    `Location: ${report.submittedLocation?.address || 'N/A'} (${Number.isFinite(report.distanceFromFeederPoint) ? `${report.distanceFromFeederPoint.toFixed(2)}m from feeder point` : 'distance unknown'})`
  )
  lines.push(`Priority: ${report.priority || 'N/A'}`)
  lines.push('')
  const description = cleanText(report.description) || 'N/A'
  const adminNotes = cleanText(report.adminNotes)
  lines.push(`Description: ${description}`)
  if (adminNotes) {
    lines.push(`Admin Notes: ${adminNotes}`)
  }
  lines.push('')
  lines.push('Questions & Answers:')
  if (answers.length === 0) {
    lines.push('  No answers recorded.')
  } else {
    answers.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.question}`)
      lines.push(`   Answer: ${item.answer || 'N/A'}`)
      if (item.notes) lines.push(`   Notes: ${item.notes}`)
      if (item.photos.length) {
        lines.push(`   Photos saved: ${item.photos.join(', ')}`)
      }
    })
  }

  lines.push('')
  lines.push('Attachments:')
  if (attachments.length === 0) {
    lines.push('  No attachments included.')
  } else {
    attachments.forEach(att => {
      const label = att.originalName ? `${att.filename} (${att.originalName})` : att.filename
      lines.push(`- ${label} [type: ${att.type}]${att.error ? ` - failed: ${att.error}` : ''}`)
    })
  }

  if (failedAssets.length > 0) {
    lines.push('')
    lines.push('Download notes:')
    failedAssets.forEach(note => lines.push(`- ${note}`))
  }

  lines.push('')
  lines.push(`Exported from Improvement & Evidence Overview on ${new Date().toLocaleString()}`)

  return lines.join('\n')
}

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

const convertBufferToJpegDataUrl = (buffer: ArrayBuffer): Promise<string> => {
  // Only used when direct embed fails (e.g., webp). Canvas conversion is slower, so we avoid it unless necessary.
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([buffer], { type: 'image/*' })
      const img = new Image()
      img.crossOrigin = 'anonymous'
      const objectUrl = URL.createObjectURL(blob)
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('canvas context missing')
          ctx.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
          URL.revokeObjectURL(objectUrl)
          resolve(dataUrl)
        } catch (err) {
          URL.revokeObjectURL(objectUrl)
          reject(err)
        }
      }
      img.onerror = err => {
        URL.revokeObjectURL(objectUrl)
        reject(err)
      }
      img.src = objectUrl
    } catch (error) {
      reject(error)
    }
  })
}

const loadImageAsDataUrl = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('canvas context missing')
          ctx.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
          resolve(dataUrl)
        } catch (err) {
          reject(err)
        }
      }
      img.onerror = err => reject(err)
      img.src = url
    } catch (error) {
      reject(error)
    }
  })
}

const dataUrlToArrayBuffer = (dataUrl: string): ArrayBuffer => {
  const base64 = dataUrl.split(',')[1] || ''
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

const buildReportPdf = async (
  jsPDF: typeof import('jspdf').jsPDF,
  narrative: string,
  title: string,
  photos: { url: string; label: string }[],
  downloadAsset: (
    url: string
  ) => Promise<{ ok: boolean; error: string | null; buffer: ArrayBuffer | null; dataUrl?: string }>,
  failedAssets: string[]
) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2
  const lineHeight = 16
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setFontSize(13)
  const titleLines = doc.splitTextToSize(title, maxWidth)
  let y = margin
  titleLines.forEach(line => {
    doc.text(line, margin, y)
    y += lineHeight
  })

  doc.setFontSize(11)
  y += 6
  const lines = doc.splitTextToSize(narrative, maxWidth)
  lines.forEach(line => {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage()
      y = margin
    }
    doc.text(line, margin, y)
    y += lineHeight
  })

  let photosPlaced = 0
  let photoPage = false
  if (photos.length > 0) {
    const limitedPhotos = photos.slice(0, PDF_PHOTO_LIMIT) // limit to speed up export
    for (const photo of limitedPhotos) {
      const result = await downloadAsset(photo.url)
      if (!result.ok || !result.buffer) {
        failedAssets.push(`Photo ${photo.label} could not be downloaded: ${result.error || 'unknown error'}`)
        continue
      }

      let dataUrl: string | null = null
      if (result.dataUrl) {
        dataUrl = result.dataUrl
      } else {
        try {
          // Always convert to JPEG for reliable embedding across browsers
          dataUrl = await convertBufferToJpegDataUrl(result.buffer)
        } catch (imgError) {
          try {
            dataUrl = `data:image/jpeg;base64,${arrayBufferToBase64(result.buffer)}`
          } catch (fallbackErr) {
            failedAssets.push(
              `Photo ${photo.label} could not be embedded: ${(fallbackErr as Error).message || 'embed error'}`
            )
            continue
          }
        }
      }

      const imgWidth = maxWidth
      const imgHeight = Math.min(260, pageHeight - margin * 2 - 20)
      if (!photoPage) {
        doc.addPage()
        doc.setFontSize(12)
        doc.text('Photos', margin, margin)
        y = margin + 20
        photoPage = true
      } else if (y + imgHeight > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.setFontSize(11)
      doc.text(photo.label, margin, y)
      y += 12
      try {
        doc.addImage(dataUrl, 'JPEG', margin, y, imgWidth, imgHeight, undefined, 'FAST')
        photosPlaced += 1
      } catch (addErr) {
        failedAssets.push(
          `Photo ${photo.label} could not be embedded: ${(addErr as Error).message || 'embed error'}`
        )
      }
      y += imgHeight + 18
    }
    if (photoPage && photosPlaced === 0) {
      doc.setFontSize(11)
      doc.text('No photos could be embedded. See download notes below.', margin, y)
    }
  }

  if (failedAssets.length > 0) {
    if (!photoPage || y > pageHeight - margin - 60) {
      doc.addPage()
      y = margin
    }
    doc.setFontSize(12)
    doc.text('Download notes:', margin, y)
    y += 14
    doc.setFontSize(11)
    failedAssets.forEach(note => {
      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      const split = doc.splitTextToSize(`- ${note}`, maxWidth)
      split.forEach(line => {
        doc.text(line, margin, y)
        y += lineHeight
      })
    })
  }

  return { buffer: doc.output('arraybuffer'), photosPlaced }
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
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [zipStatus, setZipStatus] = useState<string | null>(null)

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

  const aggregate = useMemo<AggregateSummary>(() => {
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
    const answerPhotos =
      report.answers?.reduce<string[]>((acc, ans) => {
        if (ans.photos && ans.photos.length > 0) {
          acc.push(...ans.photos)
        }
        return acc
      }, []) || []
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

  const handleDownloadEvidenceZip = async () => {
    if (dateError) {
      alert('Please fix the date range before downloading.')
      return
    }

    const effectiveStart = (() => {
      const base = startDate ? new Date(startDate) : new Date()
      const lowerBound = REPORTS_START_DATE.getTime()
      return new Date(Math.max(base.getTime(), lowerBound))
    })()
    const effectiveEnd = endDate ? new Date(endDate) : new Date()
    effectiveStart.setHours(0, 0, 0, 0)
    effectiveEnd.setHours(23, 59, 59, 999)

    const dateLabel = `${formatDateFolder(effectiveStart)} to ${formatDateFolder(effectiveEnd)}`

    const confirmation = window.confirm(
      `This export can be very large (tens of GB). Make sure you have space.\n\nContinue downloading reports for ${dateLabel}?`
    )
    if (!confirmation) return

    const defaultRootName = `improvement-evidence-${formatDateFolder(effectiveStart)}-to-${formatDateFolder(effectiveEnd)}`
    const folderNameInput = window.prompt(
      'Enter a folder name to use inside the ZIP (the file still saves to your browser download location).',
      defaultRootName
    )
    if (folderNameInput === null) return
    const rootFolderName = sanitizePathSegment(folderNameInput) || defaultRootName

    setDownloadingZip(true)
    setZipStatus('Collecting reports...')

    const datedReports = filteredReports
      .map(report => ({ report, reportDate: resolveReportDate(report) }))
      .filter(item => item.reportDate && item.reportDate >= effectiveStart && item.reportDate <= effectiveEnd)

    if (datedReports.length === 0) {
      alert(`No reports found between ${formatDateFolder(effectiveStart)} and ${formatDateFolder(effectiveEnd)}.`)
      setDownloadingZip(false)
      setZipStatus(null)
      return
    }

    setZipStatus(`Preparing ${datedReports.length} reports...`)

    try {
      const { default: JSZip } = await import('jszip')
      const { jsPDF } = await import('jspdf')
      const zip = new JSZip()
      const rootFolder = zip.folder(rootFolderName)!
      const downloadCache = new Map<string, ArrayBuffer>()
      const sortedReports = datedReports.sort(
        (a, b) => (a.reportDate?.getTime() || 0) - (b.reportDate?.getTime() || 0)
      )

      const buildProxiedUrl = (rawUrl: string) => {
        try {
          const parsed = new URL(rawUrl)
          const isAllowed = ALLOWED_IMAGE_HOSTS.some(host => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))
          if (isAllowed) {
            const normalized = rawUrl.trim().replace(/\s+/g, '%20')
            return `/api/image-proxy?url=${encodeURIComponent(normalized)}`
          }
        } catch {
          // ignore parse error
        }
        return null
      }

      const downloadAsset = async (url: string) => {
        if (!url) return { ok: false, error: 'missing url' as const, buffer: null as ArrayBuffer | null, dataUrl: undefined }
        if (downloadCache.has(url)) {
          return { ok: true, error: null as const, buffer: downloadCache.get(url)!, dataUrl: undefined }
        }

        const candidates = [buildProxiedUrl(url), url].filter((u): u is string => Boolean(u))

        for (const target of candidates) {
          try {
            const response = await fetch(target, { cache: 'no-store', referrerPolicy: 'no-referrer' })
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`)
            }
            const buffer = await response.arrayBuffer()
            downloadCache.set(url, buffer)
            return { ok: true, error: null as const, buffer, dataUrl: undefined }
          } catch (error) {
            console.warn('Download attempt failed, trying fallback if any:', target, error)
          }
        }

        try {
          const dataUrl = await loadImageAsDataUrl(url)
          const buffer = dataUrlToArrayBuffer(dataUrl)
          downloadCache.set(url, buffer)
          return { ok: true, error: null as const, buffer, dataUrl }
        } catch (imgErr) {
          console.error('Failed to download asset via image fallback:', url, imgErr)
          return { ok: false, error: (imgErr as Error).message || 'failed to fetch', buffer: null, dataUrl: undefined }
        }
      }

      const tasks: Array<() => Promise<void>> = []

      let processed = 0
      for (const { report, reportDate } of sortedReports) {
        if (!reportDate) continue
        processed += 1
        setZipStatus(`Adding report ${processed} of ${sortedReports.length} (${formatDateFolder(reportDate)})`)

        const dateKey = formatDateFolder(reportDate)
        const dayFolder = rootFolder.folder(dateKey)!
        const feederSlug = sanitizePathSegment(report.feederPointName || 'feeder-point')
        const userSlug = sanitizePathSegment(report.userName || 'user')
        const reportFolder = dayFolder.folder(
          `${feederSlug}_trip-${report.tripNumber ?? 'n'}_${userSlug}_${sanitizePathSegment(report.id || 'id')}`
        )!
        const photoFolder = reportFolder.folder('photos')!
        const attachmentFolder = reportFolder.folder('attachments')!

        const answerSummaries: AnswerSummaryForZip[] = []
        const attachmentSummaries: AttachmentSummaryForZip[] = []
        const failedAssets: string[] = []
        const pdfPhotos: { url: string; label: string }[] = []

        if (report.answers && report.answers.length > 0) {
          for (let answerIndex = 0; answerIndex < report.answers.length; answerIndex++) {
            const answer = report.answers[answerIndex]
            const summary: AnswerSummaryForZip = {
              question: answer.description || answer.questionId || `Question ${answerIndex + 1}`,
              answer: cleanText(answer.answer?.toString()) || 'N/A',
              notes: cleanText(answer.notes),
              photos: []
            }

            if (answer.photos && answer.photos.length > 0) {
              for (let photoIndex = 0; photoIndex < answer.photos.length; photoIndex++) {
                const url = answer.photos[photoIndex]
                const ext = inferFileExtension(url, 'jpg')
                const filename = `answer-${answerIndex + 1}-photo-${photoIndex + 1}.${ext}`
                pdfPhotos.push({
                  url,
                  label: `Answer ${answerIndex + 1} photo ${photoIndex + 1}`
                })
                tasks.push(async () => {
                  const result = await downloadAsset(url)
                  if (result.ok && result.buffer) {
                    photoFolder.file(filename, result.buffer)
                    summary.photos.push(`photos/${filename}`)
                  } else if (result.error) {
                    failedAssets.push(`Answer photo (${summary.question}) could not download: ${result.error}`)
                  }
                })
              }
            }

            answerSummaries.push(summary)
          }
        }

        if (report.attachments && report.attachments.length > 0) {
          for (let attIndex = 0; attIndex < report.attachments.length; attIndex++) {
            const att = report.attachments[attIndex]
            const base = sanitizePathSegment(att.filename?.replace(/\.[^/.]+$/, '') || `${att.type}-${attIndex + 1}`)
            const extFromName = att.filename?.split('.').pop()
            const ext = extFromName && extFromName.length <= 5
              ? extFromName
              : inferFileExtension(att.url, att.type === 'photo' ? 'jpg' : 'bin')
            const filename = `${base}.${ext}`
            const targetFolder = att.type === 'photo' ? photoFolder : attachmentFolder
            if (att.type === 'photo') {
              pdfPhotos.push({
                url: att.url,
                label: att.filename || filename
              })
            }
            tasks.push(async () => {
              const result = await downloadAsset(att.url)
              const savedName = `${att.type === 'photo' ? 'photos' : 'attachments'}/${filename}`
              attachmentSummaries.push({
                filename: savedName,
                type: att.type,
                originalName: att.filename,
                error: result.error || undefined
              })

              if (result.ok && result.buffer) {
                targetFolder.file(filename, result.buffer)
              } else if (result.error) {
                failedAssets.push(`Attachment ${att.filename || filename} failed: ${result.error}`)
              }
            })
          }
        }

        reportFolder.file('report.json', JSON.stringify(report, null, 2))
        try {
          const pdfTitle = `${report.feederPointName || 'Feeder Point'} | Trip ${report.tripNumber ?? 'N/A'} (${formatDateFolder(reportDate)})`
          const narrative = buildReportNarrative(report, reportDate, answerSummaries, attachmentSummaries, failedAssets)
          const pdfResult = await buildReportPdf(jsPDF, narrative, pdfTitle, pdfPhotos, downloadAsset, failedAssets)
          reportFolder.file('report.pdf', pdfResult.buffer)
        } catch (pdfError) {
          console.error('Failed to generate PDF report:', pdfError)
          failedAssets.push('Could not render PDF version of the report.')
        }
        const narrativeWithNotes = buildReportNarrative(report, reportDate, answerSummaries, attachmentSummaries, failedAssets)
        reportFolder.file('report.txt', narrativeWithNotes)
      }

      if (tasks.length > 0) {
        setZipStatus(`Downloading ${tasks.length} files...`)
        let index = 0
        const worker = async () => {
          while (true) {
            const currentIndex = index
            index += 1
            const task = tasks[currentIndex]
            if (!task) break
            await task()
            if (currentIndex % 25 === 0) {
              setZipStatus(`Downloading files... (${Math.min(currentIndex + 1, tasks.length)} of ${tasks.length})`)
            }
          }
        }
        await Promise.all(Array.from({ length: Math.min(DOWNLOAD_CONCURRENCY, tasks.length) }, worker))
      }

      setZipStatus('Compressing ZIP...')
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(zipBlob)
      link.download = `${rootFolderName}_${dateLabel}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      setZipStatus('Download ready')
    } catch (error) {
      console.error('Failed to build ZIP export:', error)
      alert('Could not download the historical reports right now. Please try again.')
    } finally {
      setTimeout(() => setZipStatus(null), 2000)
      setDownloadingZip(false)
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
          <div className="flex flex-col gap-2 sm:items-end">
            <button
              onClick={handleDownloadEvidenceZip}
              disabled={downloadingZip || reports.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              <span>{downloadingZip ? 'Preparing ZIP...' : 'Download day-wise ZIP'}</span>
            </button>
            <p className="text-xs text-gray-600 max-w-xs text-right">
              Exports reports for the selected date range (not before {formatDateFolder(REPORTS_START_DATE)}) into date folders with questions, answers, and photos. Ensure you have enough disk space before starting.
            </p>
            {zipStatus && (
              <p className="text-xs text-indigo-700 font-semibold text-right">{zipStatus}</p>
            )}
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
                    {aggregate.earliest?.toLocaleDateString() ?? '--'} to{' '}
                    {aggregate.latest?.toLocaleDateString() ?? '--'}
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
                      <option value="top">Top performers (&gt;=70%)</option>
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
