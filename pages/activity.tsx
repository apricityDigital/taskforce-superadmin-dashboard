import { useEffect, useState } from 'react'
import { Activity, Users, MessageSquare, Shield, UserCheck, Clock, Filter } from 'lucide-react'
import { DataService } from '@/lib/dataService'

export default function ActivityLog() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      const data = await DataService.getRecentActivity()
      setActivities(data)
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true
    return activity.type === filter
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <Users className="h-5 w-5 text-blue-600" />
      case 'complaint_created':
        return <MessageSquare className="h-5 w-5 text-red-600" />
      case 'access_request':
        return <UserCheck className="h-5 w-5 text-yellow-600" />
      case 'security_event':
        return <Shield className="h-5 w-5 text-purple-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_registered':
        return 'bg-blue-100'
      case 'complaint_created':
        return 'bg-red-100'
      case 'access_request':
        return 'bg-yellow-100'
      case 'security_event':
        return 'bg-purple-100'
      default:
        return 'bg-gray-100'
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
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Activity Log</h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">
                Real-time system activity and user actions
              </p>
            </div>
          </div>
          
          {/* Filter */}
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
              >
                <option value="all">All Activities</option>
                <option value="user_registered">User Registrations</option>
                <option value="complaint_created">Complaints</option>
                <option value="access_request">Access Requests</option>
                <option value="security_event">Security Events</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">User Actions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activities.filter(a => a.type === 'user_registered').length}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-500">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Complaints</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activities.filter(a => a.type === 'complaint_created').length}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Access Requests</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activities.filter(a => a.type === 'access_request').length}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Security Events</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activities.filter(a => a.type === 'security_event').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          
          <div className="flow-root">
            <ul className="-mb-8">
              {filteredActivities.map((activity, index) => (
                <li key={activity.id || index}>
                  <div className="relative pb-8">
                    {index !== filteredActivities.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                    )}
                    <div className="relative flex space-x-3">
                      <div className={`h-8 w-8 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center ring-8 ring-white`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-900">
                            {activity.description}
                          </p>
                          {activity.details && (
                            <p className="mt-1 text-sm text-gray-500">
                              {activity.details}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {activity.timestamp?.toDate?.()?.toLocaleString() || 'Just now'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No activities</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? 'System activities will appear here as they occur.'
                  : `No ${filter.replace('_', ' ')} activities found.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
