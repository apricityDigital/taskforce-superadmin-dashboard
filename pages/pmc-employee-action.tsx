import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import {
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  Loader2,
  MapPin,
  User,
  Clock
} from 'lucide-react'
import { DataService, ComplianceReport } from '@/lib/dataService'
import { useAuth } from '@/contexts/AuthContext'

const ZONE_KEYS = ['Q1', 'q1', 'q1_zone_name', 'zone_name']
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const ZONE_SLUGS = new Set(ZONE_KEYS.map(key => slugify(key)))

const resolveDate = (value: any): Date | null => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

const formatDate = (value: any) => {
  const date = resolveDate(value)
  return date ? date.toLocaleString() : 'N/A'
}

const getZoneFromReport = (report: ComplianceReport) => {
  const match = report.answers?.find(answer => answer.questionId && ZONE_SLUGS.has(slugify(answer.questionId)))
  const zoneValue = match?.answer?.toString().trim()
  if (zoneValue) {
    return zoneValue
  }
  return report.feederPointName || 'Unknown Zone'
}

export default function PmcEmployeeActionPage() {
  const [reports, setReports] = useState<ComplianceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [zoneFilter, setZoneFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'requires_action' | 'action_taken'>('requires_action')
  const { user } = useAuth()

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    const unsubscribe = DataService.onComplianceReportsChange((incoming) => {
      if (!isMounted) return
      setReports(incoming)
      setLoading(false)
    })

    return () => {
      isMounted = false
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  const zones = useMemo(() => {
    const zoneSet = new Set<string>()
    reports.forEach(report => zoneSet.add(getZoneFromReport(report)))
    return Array.from(zoneSet).filter(Boolean).sort((a, b) => a.localeCompare(b))
  }, [reports])

  const filteredReports = useMemo(() => {
    if (zoneFilter === 'all') return reports
    return reports.filter(report => getZoneFromReport(report) === zoneFilter)
  }, [reports, zoneFilter])

  const actionRequiredReports = useMemo(
    () => filteredReports.filter(report => report.status === 'requires_action'),
    [filteredReports]
  )
  const pmcReports = useMemo(
    () => filteredReports.filter(report => report.status === 'action_taken'),
    [filteredReports]
  )

  const renderReportCard = (report: ComplianceReport, isResolved: boolean) => {
    const zoneLabel = getZoneFromReport(report)
    const workNote = report.actionTakenNote || report.adminNotes || 'No action note provided.'

    return (
      <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            {isResolved ? (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            )}
            <span>{isResolved ? 'Resolved by PMC' : 'Action Required'}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-100 rounded-full px-3 py-1">
            <MapPin className="h-4 w-4" />
            {zoneLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{report.feederPointName || 'Feeder point not set'}</p>
            {report.description && <p className="text-gray-600">{report.description}</p>}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span>{report.userName || report.submittedBy || 'Unknown submitter'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{formatDate(report.submittedAt || report.createdAt || report.updatedAt)}</span>
            </div>
          </div>
        </div>

        {!isResolved && report.adminNotes && (
          <div className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-2">
            Existing notes: {report.adminNotes}
          </div>
        )}

        {isResolved && (
          <div className="border border-emerald-100 bg-emerald-50 text-sm text-emerald-900 rounded-lg p-3 space-y-1">
            <p className="font-semibold">PMC Work Summary</p>
            <p>{workNote}</p>
            {report.actionTakenPhoto && (
              <div className="mt-2">
                <img
                  src={report.actionTakenPhoto}
                  alt="PMC action proof"
                  className="w-full h-48 object-cover rounded-lg border border-emerald-100"
                />
                <p className="text-xs text-emerald-800 mt-1">Proof shared by PMC</p>
              </div>
            )}
            {report.reviewedBy && <p className="text-xs text-emerald-800">Reviewed by: {report.reviewedBy}</p>}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>PMC Employee Action | SuperAdmin</title>
      </Head>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PMC Employee Action</h1>
            <p className="text-gray-600">
              Focus on action-required reports by zone and log the work completed by PMC employees.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4 text-gray-500" />
              Zone
            </label>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All zones</option>
              {zones.map(zone => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Action Required</p>
            <div className="flex items-center gap-2 mt-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <p className="text-2xl font-bold text-gray-900">{actionRequiredReports.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">PMC Reports</p>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <p className="text-2xl font-bold text-gray-900">{pmcReports.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Current Zone</p>
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="h-5 w-5 text-primary-600" />
              <p className="text-lg font-semibold text-gray-900">
                {zoneFilter === 'all' ? 'All zones' : zoneFilter}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('requires_action')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              activeTab === 'requires_action'
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Action Required ({actionRequiredReports.length})
          </button>
          <button
            onClick={() => setActiveTab('action_taken')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              activeTab === 'action_taken'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            PMC Reports ({pmcReports.length})
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            {activeTab === 'requires_action' ? (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">Action Required Reports</h2>
              </>
            ) : (
              <>
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900">PMC Reports (Action Taken)</h2>
              </>
            )}
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading reports...
            </div>
          ) : activeTab === 'requires_action' ? (
            actionRequiredReports.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center text-gray-500">
                No action-required reports for this zone.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {actionRequiredReports.map(report => renderReportCard(report, false))}
              </div>
            )
          ) : pmcReports.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center text-gray-500">
              No PMC reports logged yet for this zone.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pmcReports.map(report => renderReportCard(report, true))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
