import { useEffect, useState } from 'react'
import {
  Users,
  UserCheck,
  MessageSquare,
  Shield,
  Activity,
  TrendingUp,
  CheckCircle,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Database,
  Zap,
  MapPin,
  Settings
} from 'lucide-react'
import { DataService, DashboardStats } from '@/lib/dataService'

export default function SimpleDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [feederPoints, setFeederPoints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsData, activityData, feederPointsData] = await Promise.all([
        DataService.getDashboardStats(),
        DataService.getRecentActivity(),
        DataService.getAllFeederPoints()
      ])

      setStats(statsData)
      setRecentActivity(activityData)
      // Show only real feeder points from database, limit to 5 for dashboard overview
      setFeederPoints(feederPointsData.slice(0, 5))
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      change: '+12%'
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      change: '+8%'
    },
    {
      title: 'Pending Requests',
      value: stats?.pendingRequests || 0,
      icon: UserCheck,
      color: 'bg-gradient-to-br from-amber-500 to-amber-600',
      change: '-5%'
    },
    {
      title: 'Security Events',
      value: stats?.totalIPRecords || 0,
      icon: Shield,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      change: '+15%'
    },
    {
      title: 'Total Complaints',
      value: stats?.totalComplaints || 0,
      icon: MessageSquare,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      change: '+3%'
    },
    {
      title: 'Inspections',
      value: stats?.totalInspections || 0,
      icon: Activity,
      color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      change: '+7%'
    },
    {
      title: 'Teams Active',
      value: stats?.totalTeams || 0,
      icon: Users,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      change: '+2%'
    },
    {
      title: 'Feeder Points',
      value: stats?.totalFeederPoints || 0,
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-teal-500 to-teal-600',
      change: '+1%'
    }
  ]

  return (
    <div className="space-y-8 scrollable-content">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 sm:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Taskforce Command Center</h1>
          <p className="text-base sm:text-lg lg:text-xl opacity-90">
            Real-time monitoring and management of your entire Taskforce ecosystem
          </p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, index) => (
          <div key={stat.title} className="stat-card group">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2 truncate">{stat.title}</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</div>
                  <span className="text-xs sm:text-sm font-semibold px-2 py-1 rounded-full text-emerald-700 bg-emerald-100 self-start">
                    {stat.change}
                  </span>
                </div>
              </div>

              <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${stat.color} transform group-hover:rotate-12 transition-transform duration-300 flex-shrink-0`}>
                <stat.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 w-full rounded-b-2xl"></div>
          </div>
        ))}
      </div>

      {/* System Health & Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        {/* System Health */}
        <div className="card">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <Server className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
            System Health
          </h2>
          
          <div className="space-y-6">
            {[
              { label: 'CPU Usage', value: 85, icon: Cpu, color: 'blue' },
              { label: 'Memory', value: 72, icon: HardDrive, color: 'green' },
              { label: 'Storage', value: 45, icon: Database, color: 'yellow' },
              { label: 'Network', value: 98, icon: Wifi, color: 'purple' }
            ].map((item, index) => (
              <div key={item.label} className="flex items-center space-x-4">
                <item.icon className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-green-600" />
            Live Activity Feed
          </h2>

          <div className="space-y-4 max-h-80 overflow-y-auto">
            {recentActivity.slice(0, 8).map((activity, index) => (
              <div
                key={activity.id || index}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`p-2 rounded-full ${
                  activity.type === 'user_registered' ? 'bg-blue-100' :
                  activity.type === 'complaint_created' ? 'bg-red-100' :
                  'bg-gray-100'
                }`}>
                  {activity.type === 'user_registered' ? (
                    <Users className="h-4 w-4 text-blue-600" />
                  ) : activity.type === 'complaint_created' ? (
                    <MessageSquare className="h-4 w-4 text-red-600" />
                  ) : (
                    <Activity className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {activity.timestamp?.toDate?.()?.toLocaleString() || 'Just now'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feeder Points Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Zap className="h-6 w-6 mr-2 text-blue-600" />
            Feeder Points Overview
          </h2>
          <a
            href="/feeder-points"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All →
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feeder Points Stats */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Zap className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Total Points</p>
                    <p className="text-2xl font-bold text-blue-900">{feederPoints.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Active</p>
                    <p className="text-2xl font-bold text-green-900">
                      {feederPoints.filter(fp => fp.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Settings className="h-8 w-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-600">Maintenance</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {feederPoints.filter(fp => fp.status === 'maintenance').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600">Assigned</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {feederPoints.filter(fp => fp.assignedUserId || fp.assignedTeamId).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Feeder Points */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Feeder Points</h3>
            <div className="space-y-3">
              {feederPoints.slice(0, 5).map((fp, index) => (
                <div key={fp.id || index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    fp.status === 'active' ? 'bg-green-100' :
                    fp.status === 'maintenance' ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    <Zap className={`h-4 w-4 ${
                      fp.status === 'active' ? 'text-green-600' :
                      fp.status === 'maintenance' ? 'text-yellow-600' :
                      'text-red-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {fp.name || `Feeder Point ${index + 1}`}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{fp.location?.address || 'No location'}</span>
                      <span className={`px-2 py-1 rounded-full ${
                        fp.status === 'active' ? 'bg-green-100 text-green-800' :
                        fp.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {fp.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {feederPoints.length === 0 && (
                <div className="text-center py-8">
                  <Zap className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No feeder points</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Feeder points will appear here when they are created.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/users" className="btn-primary text-center block">
            View All Users
          </a>
          <a href="/access-requests" className="btn-secondary text-center block">
            Review Pending Requests
          </a>
          <a href="/activity" className="btn-secondary text-center block">
            View Activity Log
          </a>
        </div>
      </div>
    </div>
  )
}
