import { useEffect, useMemo, useState } from 'react'
import { Download, Filter, Inbox, Clock } from 'lucide-react'
import { DataService, AccessRequest, Complaint } from '@/lib/dataService'

type RequestType = 'access_request' | 'complaint'

interface RequestFeedItem {
  id: string
  type: RequestType
  title: string
  requester: string
  source: string
  status?: string
  createdAt: Date | null
  metadataSummary?: string
  metadata?: Record<string, string | number | undefined>
}

const coerceDate = (value: any): Date | null => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') {
    const converted = value.toDate()
    return converted instanceof Date && !Number.isNaN(converted.getTime()) ? converted : null
  }
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

const formatDate = (date: Date | null) => {
  if (!date) return 'N/A'
  return date.toLocaleString()
}

const formatCsvValue = (value: string | number | undefined) => {
  const stringValue = value === undefined ? '' : String(value)
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

const humanizeKey = (key: string) => {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, char => char.toUpperCase())
}

const getStatusBadge = (status?: string) => {
  const normalized = status?.toLowerCase()
  switch (normalized) {
    case 'pending':
      return 'badge-warning'
    case 'approved':
    case 'resolved':
      return 'badge-success'
    case 'rejected':
    case 'closed':
      return 'badge-danger'
    case 'in_progress':
      return 'badge-info'
    default:
      return 'badge-info'
  }
}

const getTypeBadge = (type: RequestType) => {
  if (type === 'access_request') {
    return 'bg-primary-100 text-primary-800'
  }
  return 'bg-orange-100 text-orange-800'
}

export default function RequestFeederPointPage() {
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [accessLoaded, setAccessLoaded] = useState(false)
  const [complaintsLoaded, setComplaintsLoaded] = useState(false)
  const [typeFilter, setTypeFilter] = useState<RequestType | 'all'>('all')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const unsubscribeAccess = DataService.onAccessRequestsChange(data => {
      setAccessRequests(data)
      setAccessLoaded(true)
    })

    const unsubscribeComplaints = DataService.onComplaintsChange(data => {
      setComplaints(data)
      setComplaintsLoaded(true)
    })

    return () => {
      if (typeof unsubscribeAccess === 'function') {
        unsubscribeAccess()
      }
      if (typeof unsubscribeComplaints === 'function') {
        unsubscribeComplaints()
      }
    }
  }, [])

  const incomingRequests = useMemo<RequestFeedItem[]>(() => {
    const normalizedAccess: RequestFeedItem[] = accessRequests.map(request => {
      const metadata = {
        requestedRole: request.requestedRole,
        organization: request.organization,
        department: request.department,
        email: request.email,
        phone: request.phone
      }

      const metadataSummary = [
        request.requestedRole && `Role: ${request.requestedRole.replace(/_/g, ' ')}`,
        request.organization && `Org: ${request.organization}`,
        request.department && `Dept: ${request.department}`,
        request.email && `Email: ${request.email}`,
        request.phone && `Phone: ${request.phone}`
      ].filter(Boolean).join(' • ')

      return {
        id: `access-${request.id}`,
        type: 'access_request',
        title: request.name ? `${request.name} (${request.requestedRole?.replace(/_/g, ' ') || 'Access'})` : 'Access Request',
        requester: request.name || 'Unknown requester',
        source: 'Access Requests',
        status: request.status,
        createdAt: coerceDate(request.createdAt),
        metadataSummary,
        metadata
      }
    })

    const normalizedComplaints: RequestFeedItem[] = complaints.map(complaint => {
      const metadata = {
        category: complaint.category,
        priority: complaint.priority,
        description: complaint.description
      }

      const metadataSummary = [
        complaint.category && `Category: ${complaint.category}`,
        complaint.priority && `Priority: ${complaint.priority}`,
        complaint.description && `Detail: ${complaint.description.slice(0, 80)}${complaint.description.length > 80 ? '...' : ''}`
      ].filter(Boolean).join(' • ')

      return {
        id: `complaint-${complaint.id}`,
        type: 'complaint',
        title: complaint.title || 'Complaint',
        requester: complaint.reportedBy || 'Anonymous',
        source: 'Complaints',
        status: complaint.status,
        createdAt: coerceDate(complaint.createdAt),
        metadataSummary,
        metadata
      }
    })

    return [...normalizedAccess, ...normalizedComplaints].sort((a, b) => {
      const aTime = a.createdAt ? a.createdAt.getTime() : 0
      const bTime = b.createdAt ? b.createdAt.getTime() : 0
      return bTime - aTime
    })
  }, [accessRequests, complaints])

  const filteredRequests = useMemo(() => {
    if (typeFilter === 'all') return incomingRequests
    return incomingRequests.filter(request => request.type === typeFilter)
  }, [incomingRequests, typeFilter])

  const isLoading = !(accessLoaded && complaintsLoaded)

  const handleDownload = () => {
    if (!filteredRequests.length) {
      alert('There is no request data to download yet.')
      return
    }

    setExporting(true)
    try {
      const headers = ['ID', 'Type', 'Title', 'Requester', 'Source', 'Status', 'Date', 'Metadata']
      const rows = filteredRequests.map(request => {
        const metadataString = Object.entries(request.metadata || {})
          .filter(([, value]) => value !== undefined && value !== null && value !== '')
          .map(([key, value]) => `${humanizeKey(key)}: ${value}`)
          .join(' | ')

        return [
          request.id,
          request.type === 'access_request' ? 'Access Request' : 'Complaint',
          request.title,
          request.requester,
          request.source,
          request.status || 'N/A',
          request.createdAt ? request.createdAt.toISOString() : 'N/A',
          metadataString
        ]
      })

      const csvContent = [headers, ...rows]
        .map(row => row.map(value => formatCsvValue(value)).join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `request-feeder-point-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting requests:', error)
      alert('Unable to export request data right now. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const totalCount = incomingRequests.length
  const accessCount = incomingRequests.filter(request => request.type === 'access_request').length
  const complaintCount = incomingRequests.filter(request => request.type === 'complaint').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-primary-700">
            <Inbox className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase">Request Feeder Point</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Centralized Requests</h1>
          <p className="text-gray-600 mt-1">
            All incoming requests aggregated in one place for fast triage, export, and future filtering.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownload}
            className="btn-primary flex items-center space-x-2"
            disabled={!filteredRequests.length || exporting}
          >
            <Download className="h-5 w-5" />
            <span>{exporting ? 'Preparing...' : 'Download CSV'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Incoming</p>
              <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
              <Inbox className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Access Requests</p>
              <p className="text-3xl font-bold text-gray-900">{accessCount}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Complaints</p>
              <p className="text-3xl font-bold text-gray-900">{complaintCount}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center">
              <Filter className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Filter className="h-5 w-5 text-primary-600" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Unified request intake</p>
            <p className="text-xs text-gray-500">
              Consistent fields keep data ready for sorting and future filters.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Source</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as RequestType | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All sources</option>
            <option value="access_request">Access Requests</option>
            <option value="complaint">Complaints</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <div className="scrollable-table">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Request</th>
                <th className="table-header">Source</th>
                <th className="table-header">Requester</th>
                <th className="table-header">Date</th>
                <th className="table-header">Status</th>
                <th className="table-header">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map(request => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <span className={`badge ${getTypeBadge(request.type)}`}>
                        {request.type === 'access_request' ? 'Access' : 'Complaint'}
                      </span>
                      <span className="font-medium text-gray-900">{request.title}</span>
                    </div>
                  </td>
                  <td className="table-cell">{request.source}</td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">{request.requester}</div>
                    {request.metadata?.email && (
                      <div className="text-xs text-gray-500">{request.metadata.email}</div>
                    )}
                  </td>
                  <td className="table-cell text-gray-700">
                    {formatDate(request.createdAt)}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${getStatusBadge(request.status)}`}>
                      {(request.status || 'N/A').toUpperCase()}
                    </span>
                  </td>
                  <td className="table-cell text-gray-700">
                    {request.metadataSummary || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!filteredRequests.length && (
          <div className="text-center py-12 text-gray-500">
            No requests available for the selected source.
          </div>
        )}
      </div>
    </div>
  )
}
