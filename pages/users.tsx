import { useEffect, useState } from 'react'
import { Search, Filter, Download, Eye, Edit, Trash2, X, MapPin, Calendar, FileText, TrendingUp, AlertTriangle, CheckCircle, Users, UserCheck, UserX } from 'lucide-react'
import { DataService, User } from '@/lib/dataService'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [userReports, setUserReports] = useState<any[]>([])
  const [userFeederPoints, setUserFeederPoints] = useState<any[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const unsubscribe = DataService.onUsersChange(usersData => {
      setUsers(usersData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter, statusFilter])

  

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm)
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive
      )
    }

    setFilteredUsers(filtered)
  }

  const getRoleBadge = (role: string) => {
    const roleColors = {
      admin: 'badge-danger',
      task_force_team: 'badge-info',
      commissioner: 'badge-warning'
    }
    return roleColors[role as keyof typeof roleColors] || 'badge-info'
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 'badge-success' : 'badge-danger'
  }

  const handleViewUser = async (user: User) => {
    setSelectedUser(user)
    setShowUserModal(true)

    try {
      // Load user's reports and feeder points
      const [reports, feederPoints] = await Promise.all([
        DataService.getUserReports(user.id),
        DataService.getUserFeederPoints(user.id)
      ])
      setUserReports(reports)
      setUserFeederPoints(feederPoints)
    } catch (error) {
      console.error('Error loading user details:', error)
      setUserReports([])
      setUserFeederPoints([])
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user })
    setShowEditModal(true)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    try {
      await DataService.updateUser(editingUser.id, editingUser)
      await loadUsers() // Reload users
      setShowEditModal(false)
      setEditingUser(null)
      alert('User updated successfully!')
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user. Please try again.')
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await DataService.deleteUser(user.id)
      await loadUsers() // Reload users
      alert('User deleted successfully!')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user. Please try again.')
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
    <div className="space-y-6 scrollable-content">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
            <p className="mt-2 text-gray-600">
              Manage all registered users in the system ({users.length} total)
            </p>
          </div>
          <button className="btn-primary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Users</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="task_force_team">Task Force Team</option>
            <option value="commissioner">Commissioner</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Advanced Filters</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <div className="scrollable-table">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">User</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Role</th>
                <th className="table-header">Organization</th>
                <th className="table-header">Status</th>
                <th className="table-header">Joined</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">ID: {user.id}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div>
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${getRoleBadge(user.role)}`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div>
                      <div className="text-sm text-gray-900">{user.organization || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{user.department || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${getStatusBadge(user.isActive)}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="text-sm text-gray-900">
                      {user.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1 text-gray-400 hover:text-warning-600 transition-colors"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-1 text-gray-400 hover:text-danger-600 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No users found matching your criteria</div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="text-sm text-gray-600">Total Users</div>
          <div className="text-2xl font-semibold text-gray-900">{users.length}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-gray-600">Active Users</div>
          <div className="text-2xl font-semibold text-success-600">
            {users.filter(u => u.isActive).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-gray-600">Admins</div>
          <div className="text-2xl font-semibold text-danger-600">
            {users.filter(u => u.role === 'admin').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-gray-600">Task Force</div>
          <div className="text-2xl font-semibold text-primary-600">
            {users.filter(u => u.role === 'task_force_team').length}
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowUserModal(false)} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Users className="h-6 w-6 mr-2 text-blue-600" />
                    User Details: {selectedUser.name}
                  </h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* User Info */}
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">User Information</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Name</label>
                          <p className="text-sm text-gray-900">{selectedUser.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <p className="text-sm text-gray-900">{selectedUser.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <p className="text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Role</label>
                          <p className="text-sm text-gray-900">{selectedUser.role}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Organization</label>
                          <p className="text-sm text-gray-900">{selectedUser.organization || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedUser.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Joined</label>
                          <p className="text-sm text-gray-900">
                            {selectedUser.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Feeder Points Summary */}
                    <div className="bg-blue-50 rounded-lg p-4 mt-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                        Feeder Points Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{userFeederPoints.length}</p>
                          <p className="text-sm text-gray-600">Total Points</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {userFeederPoints.filter(fp => fp.status === 'active').length}
                          </p>
                          <p className="text-sm text-gray-600">Active Points</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">
                            {userFeederPoints.filter(fp => fp.status === 'maintenance').length}
                          </p>
                          <p className="text-sm text-gray-600">Maintenance</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">
                            {userFeederPoints.filter(fp => fp.status === 'inactive').length}
                          </p>
                          <p className="text-sm text-gray-600">Inactive</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reports and Activities */}
                  <div className="lg:col-span-2">
                    <div className="bg-white border rounded-lg">
                      <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                          <button className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                            Reports ({userReports.length})
                          </button>
                          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                            Feeder Points ({userFeederPoints.length})
                          </button>
                        </nav>
                      </div>

                      <div className="p-6 max-h-96 overflow-y-auto">
                        {/* Reports Section */}
                        <div className="space-y-4">
                          <h5 className="text-lg font-medium text-gray-900 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-gray-600" />
                            Submitted Reports
                          </h5>

                          {userReports.length > 0 ? (
                            <div className="space-y-3">
                              {userReports.map((report, index) => (
                                <div key={report.id || index} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h6 className="font-medium text-gray-900">{report.title || 'Untitled Report'}</h6>
                                      <p className="text-sm text-gray-600 mt-1">{report.description || 'No description'}</p>
                                      <div className="flex items-center mt-2 space-x-4">
                                        <span className="flex items-center text-xs text-gray-500">
                                          <Calendar className="h-3 w-3 mr-1" />
                                          {report.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                                        </span>
                                        <span className="flex items-center text-xs text-gray-500">
                                          <MapPin className="h-3 w-3 mr-1" />
                                          {report.location || 'No location'}
                                        </span>
                                      </div>
                                    </div>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                      report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {report.status || 'pending'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <FileText className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No reports submitted</h3>
                              <p className="mt-1 text-sm text-gray-500">This user hasn't submitted any reports yet.</p>
                            </div>
                          )}

                          {/* Feeder Points Section */}
                          <div className="mt-8">
                            <h5 className="text-lg font-medium text-gray-900 flex items-center">
                              <TrendingUp className="h-5 w-5 mr-2 text-gray-600" />
                              Feeder Points Details
                            </h5>

                            {userFeederPoints.length > 0 ? (
                              <div className="mt-4 space-y-3">
                                {userFeederPoints.map((point, index) => (
                                  <div key={point.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <h6 className="font-medium text-gray-900">{point.name || `Feeder Point ${index + 1}`}</h6>
                                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            point.priority === 'high' ? 'bg-red-100 text-red-800' :
                                            point.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {point.priority || 'normal'} priority
                                          </span>
                                        </div>

                                        <div className="flex items-center text-sm text-gray-600 mb-2">
                                          <MapPin className="h-4 w-4 mr-1" />
                                          <span>{point.location?.address || point.location || 'No location specified'}</span>
                                        </div>

                                        {point.description && (
                                          <p className="text-sm text-gray-600 mb-2">{point.description}</p>
                                        )}

                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                          <span className="flex items-center">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            Assigned: {point.assignedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                                          </span>
                                          {point.assignedBy && (
                                            <span>By: {point.assignedBy}</span>
                                          )}
                                          {point.lastInspection && (
                                            <span className="flex items-center">
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                              Last: {point.lastInspection.toDate?.()?.toLocaleDateString() || 'Never'}
                                            </span>
                                          )}
                                        </div>

                                        {point.nextInspectionDue && (
                                          <div className="mt-2">
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                              new Date(point.nextInspectionDue.toDate?.() || point.nextInspectionDue) < new Date()
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-blue-100 text-blue-800'
                                            }`}>
                                              <AlertTriangle className="h-3 w-3 mr-1" />
                                              Next inspection: {point.nextInspectionDue.toDate?.()?.toLocaleDateString() || 'Not scheduled'}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex flex-col items-end space-y-2">
                                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                                          point.status === 'active' ? 'bg-green-100 text-green-800' :
                                          point.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                          point.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {point.status || 'unknown'}
                                        </span>

                                        {point.assignmentType && (
                                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                            point.assignmentType === 'individual' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                          }`}>
                                            {point.assignmentType === 'individual' ? 'Individual' : `Team: ${point.teamName || 'Unknown'}`}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No feeder points assigned</h3>
                                <p className="mt-1 text-sm text-gray-500">This user hasn't been assigned any feeder points yet.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Edit className="h-5 w-5 mr-2 text-blue-600" />
                    Edit User: {editingUser.name}
                  </h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="admin">Admin</option>
                      <option value="task_force_team">Task Force Team</option>
                      <option value="commissioner">Commissioner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                    <input
                      type="text"
                      value={editingUser.organization || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, organization: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingUser.isActive}
                        onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active User</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleSaveUser}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
