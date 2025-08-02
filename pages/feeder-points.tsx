import { useEffect, useState } from 'react'
import { 
  MapPin, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Activity,
  Zap,
  Settings,
  User,
  Team
} from 'lucide-react'
import { DataService } from '@/lib/dataService'

export default function FeederPointsPage() {
  const [feederPoints, setFeederPoints] = useState<any[]>([])
  const [filteredFeederPoints, setFilteredFeederPoints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assignmentFilter, setAssignmentFilter] = useState('all')
  const [selectedFeederPoint, setSelectedFeederPoint] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [creatingData, setCreatingData] = useState(false)

  useEffect(() => {
    loadFeederPoints()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadFeederPoints, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterFeederPoints()
  }, [feederPoints, searchTerm, statusFilter, assignmentFilter])

  const loadFeederPoints = async () => {
    try {
      // Test database connection first
      console.log('🚀 Starting feeder points load...')
      await DataService.testDatabaseConnection()

      const [feederPointsData, teamsData, usersData] = await Promise.all([
        DataService.getAllFeederPoints(),
        DataService.getTeams(),
        DataService.getAllUsers()
      ])

      console.log('🔍 Debug - Feeder Points Data:', feederPointsData)
      console.log('🔍 Debug - Teams Data:', teamsData.length)
      console.log('🔍 Debug - Users Data:', usersData.length)

      // Enhance feeder points with real assignment details from database
      const enhancedFeederPoints = feederPointsData.map(fp => {
        let assignmentDetails = null

        // Check for individual assignment
        if (fp.assignedUserId) {
          const assignedUser = usersData.find(user => user.id === fp.assignedUserId)
          if (assignedUser) {
            assignmentDetails = {
              type: 'individual',
              name: assignedUser.name || 'Unknown User',
              email: assignedUser.email || '',
              id: fp.assignedUserId,
              role: assignedUser.role || 'User'
            }
          }
        }

        // Check for team assignment
        if (fp.assignedTeamId) {
          const assignedTeam = teamsData.find(team => team.id === fp.assignedTeamId)
          if (assignedTeam) {
            const activeMembers = assignedTeam.members?.filter(member => member.isActive) || []
            assignmentDetails = {
              type: 'team',
              name: assignedTeam.name || 'Unknown Team',
              memberCount: activeMembers.length,
              id: fp.assignedTeamId,
              members: activeMembers
            }
          }
        }

        return {
          ...fp,
          assignmentDetails
        }
      })

      setFeederPoints(enhancedFeederPoints)
      setConnectionStatus('connected')
    } catch (error) {
      console.error('❌ Error loading feeder points:', error)
      setFeederPoints([]) // Set empty array on error, no dummy data
      setConnectionStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const filterFeederPoints = () => {
    let filtered = feederPoints

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(fp =>
        fp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fp.location?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fp.assignmentDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(fp => fp.status === statusFilter)
    }

    // Assignment filter
    if (assignmentFilter !== 'all') {
      if (assignmentFilter === 'assigned') {
        filtered = filtered.filter(fp => fp.assignmentDetails)
      } else if (assignmentFilter === 'unassigned') {
        filtered = filtered.filter(fp => !fp.assignmentDetails)
      } else if (assignmentFilter === 'individual') {
        filtered = filtered.filter(fp => fp.assignmentDetails?.type === 'individual')
      } else if (assignmentFilter === 'team') {
        filtered = filtered.filter(fp => fp.assignmentDetails?.type === 'team')
      }
    }

    setFilteredFeederPoints(filtered)
  }

  const handleViewDetails = (feederPoint: any) => {
    setSelectedFeederPoint(feederPoint)
    setShowDetailsModal(true)
  }

  const createSampleData = async () => {
    setCreatingData(true)
    try {
      await DataService.createSampleFeederPoints()
      alert('Sample feeder points created successfully!')
      await loadFeederPoints() // Reload data
    } catch (error) {
      console.error('Error creating sample data:', error)
      alert('Error creating sample data. Check console for details.')
    } finally {
      setCreatingData(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const stats = {
    total: feederPoints.length,
    active: feederPoints.filter(fp => fp.status === 'active').length,
    maintenance: feederPoints.filter(fp => fp.status === 'maintenance').length,
    inactive: feederPoints.filter(fp => fp.status === 'inactive').length,
    assigned: feederPoints.filter(fp => fp.assignmentDetails).length,
    unassigned: feederPoints.filter(fp => !fp.assignmentDetails).length,
    individual: feederPoints.filter(fp => fp.assignmentDetails?.type === 'individual').length,
    team: feederPoints.filter(fp => fp.assignmentDetails?.type === 'team').length
  }

  return (
    <div className="space-y-6 scrollable-content">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Feeder Points Monitor</h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">
                Real-time monitoring of all feeder points and assignments
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
              connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'error' ? 'bg-red-500' :
                'bg-yellow-500'
              }`} />
              <span>
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'error' ? 'Connection Error' :
                 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Maintenance</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.maintenance}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.assigned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Assigned</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(stats.assigned / stats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.assigned}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Unassigned</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(stats.unassigned / stats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.unassigned}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Types</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Individual</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${stats.assigned > 0 ? (stats.individual / stats.assigned) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.individual}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Team</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${stats.assigned > 0 ? (stats.team / stats.assigned) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.team}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search feeder points..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Assignments</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
              <option value="individual">Individual</option>
              <option value="team">Team</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feeder Points Table */}
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Feeder Points ({filteredFeederPoints.length})
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Activity className="h-4 w-4" />
              <span>Real-time data</span>
            </div>
          </div>

          <div className="scrollable-table">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feeder Point
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Inspection
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFeederPoints.map((feederPoint, index) => (
                  <tr key={feederPoint.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {feederPoint.name || `Feeder Point ${index + 1}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {feederPoint.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-900">
                            {feederPoint.location?.address ||
                             feederPoint.address ||
                             (feederPoint.location?.latitude && feederPoint.location?.longitude
                               ? `${feederPoint.location.latitude}, ${feederPoint.location.longitude}`
                               : 'No location data')}
                          </div>
                          {feederPoint.location?.latitude && feederPoint.location?.longitude && (
                            <div className="text-xs text-gray-500">
                              {feederPoint.location.latitude.toFixed(4)}, {feederPoint.location.longitude.toFixed(4)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(feederPoint.status)}`}>
                        {feederPoint.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {feederPoint.assignmentDetails ? (
                        <div className="flex items-center">
                          {feederPoint.assignmentDetails.type === 'individual' ? (
                            <User className="h-4 w-4 text-blue-500 mr-2" />
                          ) : (
                            <Users className="h-4 w-4 text-purple-500 mr-2" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {feederPoint.assignmentDetails.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {feederPoint.assignmentDetails.type === 'individual' ? 'Individual' : `Team (${feederPoint.assignmentDetails.memberCount} members)`}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(feederPoint.priority)}`}>
                        {feederPoint.priority || 'normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {feederPoint.lastInspection ? (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {feederPoint.lastInspection.toDate?.()?.toLocaleDateString() || 'Invalid date'}
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(feederPoint)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredFeederPoints.length === 0 && !loading && (
            <div className="text-center py-12">
              <Zap className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {feederPoints.length === 0 ? 'No feeder points in database' : 'No feeder points match your filters'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {feederPoints.length === 0
                  ? 'Feeder points will appear here when they are created in the mobile app.'
                  : searchTerm || statusFilter !== 'all' || assignmentFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'All feeder points are currently filtered out.'}
              </p>
              {feederPoints.length === 0 && (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Debug Info:</strong> Connected to database but no feeder points found.
                      Check the browser console for more details.
                    </p>
                  </div>
                  <button
                    onClick={createSampleData}
                    disabled={creatingData}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {creatingData ? 'Creating Sample Data...' : 'Create Sample Feeder Points'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
