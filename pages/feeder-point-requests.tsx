import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle, Clock, Download, Eye, MapPin, X, XCircle } from 'lucide-react'
import { DataService, FeederPointRequest } from '@/lib/dataService'

function formatDate(value: any): string {
  if (!value) return 'N/A'
  if (typeof value.toDate === 'function') {
    return value.toDate().toLocaleString()
  }
  if (value instanceof Date) {
    return value.toLocaleString()
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleString()
}

export default function FeederPointRequestsPage() {
  const [requests, setRequests] = useState<FeederPointRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<FeederPointRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const unsubscribe = DataService.onFeederPointRequestsChange(requestsData => {
      setRequests(requestsData)
      setLoading(false)
    })
    return () => unsubscribe?.()
  }, [])

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  }), [requests])

  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return requests
      .filter(request => statusFilter === 'all' || request.status === statusFilter)
      .filter(request => {
        if (!term) return true
        const textFields = [
          request.feederPointName,
          request.areaName,
          request.nearestLandmark,
          request.userName,
          request.userEmail,
          request.userPhone,
          request.zoneNumber,
          request.wardNumber,
          request.areaDescription,
        ]
        return textFields.some(field => (field || '').toString().toLowerCase().includes(term))
      })
  }, [requests, statusFilter, searchTerm])

  const getStatusBadge = (status: string) => {
    const badgeClasses = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger'
    }
    return badgeClasses[status as keyof typeof badgeClasses] || 'badge-info'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-success-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-danger-600" />
      default:
        return <Clock className="h-4 w-4 text-warning-600" />
    }
  }

  const handleDownload = async () => {
    if (filteredRequests.length === 0) return

    const XLSX = await import('xlsx')
    const rows = filteredRequests.map(request => ({
      'Request ID': request.id,
      'Feeder Point': request.feederPointName || request.areaName || 'N/A',
      'Area Name': request.areaName || '',
      Zone: request.zoneNumber || '',
      Ward: request.wardNumber || '',
      Priority: request.priority || 'N/A',
      Status: (request.status || '').toUpperCase(),
      'Requested By': request.userName || '',
      'User Email': request.userEmail || '',
      'User Phone': request.userPhone || '',
      'Submitted At': formatDate(request.submittedAt),
      Coordinates: request.coordinates ? `${request.coordinates.latitude}, ${request.coordinates.longitude}` : '',
      'Nearest Landmark': request.nearestLandmark || '',
      'Households (Approx)': request.approximateHouseholds || '',
      'Vehicle Type': request.vehicleType || '',
      'Additional Details': request.additionalDetails || '',
      'Area Description': request.areaDescription || '',
      'Image URL': request.imageURL || '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Feeder Requests')
    const suffix = statusFilter === 'all' ? 'all' : statusFilter
    XLSX.writeFile(workbook, `feeder-point-requests-${suffix}.xlsx`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feeder Point Request List</h1>
            <p className="mt-2 text-gray-600">
              Track every requested feeder point and review details before approving.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleDownload}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={filteredRequests.length === 0}
            >
              <Download className="h-4 w-4" />
              <span>Download (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Pending" value={stats.pending} icon={<Clock className="h-6 w-6 text-white" />} bg="bg-warning-500" />
        <StatCard title="Approved" value={stats.approved} icon={<CheckCircle className="h-6 w-6 text-white" />} bg="bg-success-500" />
        <StatCard title="Rejected" value={stats.rejected} icon={<XCircle className="h-6 w-6 text-white" />} bg="bg-danger-500" />
        <StatCard title="Total Requests" value={stats.total} icon={<MapPin className="h-6 w-6 text-white" />} bg="bg-primary-500" />
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex-1">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search requested feeder points, area, requester or zone..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Requested Feeder Point</th>
                <th className="table-header">Requester</th>
                <th className="table-header">Zone / Ward</th>
                <th className="table-header">Priority</th>
                <th className="table-header">Status</th>
                <th className="table-header">Submitted</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {request.feederPointName || request.areaName || 'Requested feeder point'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {request.areaName || 'Area not provided'}
                          {request.nearestLandmark ? ` • ${request.nearestLandmark}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm font-medium text-gray-900">{request.userName || 'Unknown requester'}</div>
                    <div className="text-xs text-gray-500">{request.userEmail || 'Email not set'}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">Zone {request.zoneNumber || 'N/A'}</div>
                    <div className="text-xs text-gray-500">Ward {request.wardNumber || 'N/A'}</div>
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-info">{request.priority || 'medium'}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(request.status)}
                      <span className={`badge ${getStatusBadge(request.status)}`}>
                        {request.status?.toUpperCase?.() || 'PENDING'}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">{formatDate(request.submittedAt)}</div>
                    {request.reviewedAt && (
                      <div className="text-xs text-gray-500">Reviewed: {formatDate(request.reviewedAt)}</div>
                    )}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="p-2 text-gray-500 hover:text-primary-600 rounded-lg hover:bg-gray-100"
                      title="Requested feeder point view"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <div className="flex justify-center mb-3">
              <AlertCircle className="h-10 w-10 text-gray-400" />
            </div>
            <div className="text-gray-500">No feeder point requests found for the current filters.</div>
          </div>
        )}
      </div>

      {selectedRequest && (
        <div className="card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Requested Feeder Point</p>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedRequest.feederPointName || selectedRequest.areaName || 'Requested feeder point'}
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedRequest.areaDescription || selectedRequest.additionalDetails || 'No description provided.'}
              </p>
            </div>
            <button
              onClick={() => setSelectedRequest(null)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              aria-label="Close detail view"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <InfoRow label="Requested By" value={selectedRequest.userName} />
            <InfoRow label="Email" value={selectedRequest.userEmail} />
            <InfoRow label="Phone" value={selectedRequest.userPhone} />
            <InfoRow label="Status" value={selectedRequest.status?.toUpperCase?.()} />
            <InfoRow label="Priority" value={selectedRequest.priority || 'N/A'} />
            <InfoRow label="Submitted At" value={formatDate(selectedRequest.submittedAt)} />
            <InfoRow label="Zone" value={selectedRequest.zoneNumber} />
            <InfoRow label="Ward" value={selectedRequest.wardNumber} />
            <InfoRow label="Nearest Landmark" value={selectedRequest.nearestLandmark} />
            <InfoRow label="Approx. Households" value={selectedRequest.approximateHouseholds} />
            <InfoRow label="Vehicle Type" value={selectedRequest.vehicleType} />
            <InfoRow label="Image" value={selectedRequest.imageURL || 'Not uploaded'} />
          </div>

          {selectedRequest.coordinates && (
            <div className="mt-4">
              <InfoRow
                label="Coordinates"
                value={`${selectedRequest.coordinates.latitude}, ${selectedRequest.coordinates.longitude}`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon, bg }: { title: string; value: number; icon: ReactNode; bg: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${bg}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-900 break-words">{value || 'N/A'}</p>
    </div>
  )
}
