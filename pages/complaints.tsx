import { useEffect, useState } from 'react'
import { Search, Filter, Eye, Edit, Trash2, X, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { DataService, Complaint } from '@/lib/dataService'

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    const unsubscribe = DataService.onComplaintsChange(complaintsData => {
      setComplaints(complaintsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    filterComplaints()
  }, [complaints, searchTerm, statusFilter, priorityFilter])

  

  const filterComplaints = () => {
    let filtered = complaints

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(c => c.priority === priorityFilter)
    }

    setFilteredComplaints(filtered)
  }

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setShowComplaintModal(true)
  }

  const handleEditComplaint = (complaint: Complaint) => {
    setEditingComplaint({ ...complaint })
    setShowEditModal(true)
  }

  const handleSaveComplaint = async () => {
    if (!editingComplaint) return

    try {
      await DataService.updateComplaint(editingComplaint.id, editingComplaint)
      await loadComplaints()
      setShowEditModal(false)
      setEditingComplaint(null)
      alert('Complaint updated successfully!')
    } catch (error) {
      console.error('Error updating complaint:', error)
      alert('Error updating complaint. Please try again.')
    }
  }

  const handleDeleteComplaint = async (complaint: Complaint) => {
    if (!confirm(`Are you sure you want to delete complaint "${complaint.title}"?`)) {
      return
    }

    try {
      await DataService.deleteComplaint(complaint.id)
      await loadComplaints()
      alert('Complaint deleted successfully!')
    } catch (error) {
      console.error('Error deleting complaint:', error)
      alert('Error deleting complaint. Please try again.')
    }
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
      <h1 className="text-3xl font-bold">Complaints</h1>

      {/* Complaints Table */}
      <div className="table-container">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Title</th>
              <th className="table-header">Category</th>
              <th className="table-header">Priority</th>
              <th className="table-header">Status</th>
              <th className="table-header">Reported By</th>
              <th className="table-header">Created At</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredComplaints.map((complaint) => (
              <tr key={complaint.id}>
                <td className="table-cell">{complaint.title}</td>
                <td className="table-cell">{complaint.category}</td>
                <td className="table-cell">{complaint.priority}</td>
                <td className="table-cell">{complaint.status}</td>
                <td className="table-cell">{complaint.reportedBy}</td>
                <td className="table-cell">{complaint.createdAt?.toDate?.().toLocaleDateString()}</td>
                <td className="table-cell">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleViewComplaint(complaint)}><Eye className="h-4 w-4" /></button>
                    <button onClick={() => handleEditComplaint(complaint)}><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDeleteComplaint(complaint)}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Complaint Modal */}
      {showEditModal && editingComplaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowEditModal(false)} />
            <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-lg sm:w-full">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Complaint</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Update the details of the complaint.</p>
                </div>
                <form className="mt-5 sm:flex sm:items-center">
                  <div className="w-full sm:max-w-xs">
                    <label htmlFor="status" className="sr-only">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={editingComplaint.status}
                      onChange={(e) => setEditingComplaint({ ...editingComplaint, status: e.target.value as any })}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveComplaint}
                    className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
