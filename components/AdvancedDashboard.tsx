import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CountUp from 'react-countup'
import { 
  Users, 
  UserCheck, 
  MessageSquare, 
  Shield, 
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  Globe,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Eye
} from 'lucide-react'
import { DataService, DashboardStats } from '@/lib/dataService'

interface AnimatedStatCardProps {
  title: string
  value: number
  icon: React.ElementType
  color: string
  gradient: string
  change: string
  changeType: 'positive' | 'negative'
  delay: number
}

function AnimatedStatCard({ title, value, icon: Icon, color, gradient, change, changeType, delay }: AnimatedStatCardProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: delay / 1000,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.05, 
        y: -5,
        transition: { duration: 0.2 }
      }}
      className="relative group"
    >
      <div className={`stat-card group ${gradient} border-0 relative overflow-hidden`}>
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          animate={{
            background: [
              'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
              'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex-1">
            <motion.p 
              className="text-sm font-medium text-gray-600 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: (delay + 200) / 1000 }}
            >
              {title}
            </motion.p>
            
            <div className="flex items-center space-x-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  delay: (delay + 400) / 1000,
                  type: "spring",
                  stiffness: 200
                }}
              >
                {isVisible && (
                  <CountUp
                    end={value}
                    duration={2}
                    className="text-3xl font-bold text-gray-900"
                  />
                )}
              </motion.div>
              
              <motion.span
                className={`text-sm font-semibold px-2 py-1 rounded-full ${
                  changeType === 'positive' 
                    ? 'text-emerald-700 bg-emerald-100' 
                    : 'text-red-700 bg-red-100'
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (delay + 600) / 1000 }}
              >
                {change}
              </motion.span>
            </div>
          </div>
          
          <motion.div
            className={`p-4 rounded-2xl ${color} relative`}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Icon className="h-8 w-8 text-white" />
            <motion.div
              className="absolute inset-0 rounded-2xl"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(59, 130, 246, 0.4)',
                  '0 0 0 10px rgba(59, 130, 246, 0)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </div>
        
        {/* Pulse Effect */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ 
            delay: delay / 1000,
            duration: 1.5,
            ease: "easeOut"
          }}
        />
      </div>
    </motion.div>
  )
}

export default function AdvancedDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [systemHealth, setSystemHealth] = useState({
    cpu: 85,
    memory: 72,
    storage: 45,
    network: 98
  })

  useEffect(() => {
    loadDashboardData()
    
    // Simulate real-time system health updates
    const interval = setInterval(() => {
      setSystemHealth(prev => ({
        cpu: Math.max(60, Math.min(95, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(50, Math.min(90, prev.memory + (Math.random() - 0.5) * 8)),
        storage: Math.max(30, Math.min(80, prev.storage + (Math.random() - 0.5) * 5)),
        network: Math.max(85, Math.min(100, prev.network + (Math.random() - 0.5) * 3))
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsData, activityData] = await Promise.all([
        DataService.getDashboardStats(),
        DataService.getRecentActivity()
      ])
      
      setStats(statsData)
      setRecentActivity(activityData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          className="relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
          <motion.div
            className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      gradient: 'bg-gradient-to-br from-blue-50 to-blue-100',
      change: '+12%',
      changeType: 'positive' as const,
      delay: 100
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      gradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      change: '+8%',
      changeType: 'positive' as const,
      delay: 200
    },
    {
      title: 'Pending Requests',
      value: stats?.pendingRequests || 0,
      icon: UserCheck,
      color: 'bg-gradient-to-br from-amber-500 to-amber-600',
      gradient: 'bg-gradient-to-br from-amber-50 to-amber-100',
      change: '-5%',
      changeType: 'negative' as const,
      delay: 300
    },
    {
      title: 'Security Events',
      value: stats?.totalIPRecords || 0,
      icon: Shield,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      gradient: 'bg-gradient-to-br from-purple-50 to-purple-100',
      change: '+15%',
      changeType: 'positive' as const,
      delay: 400
    },
    {
      title: 'Total Complaints',
      value: stats?.totalComplaints || 0,
      icon: MessageSquare,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      gradient: 'bg-gradient-to-br from-red-50 to-red-100',
      change: '+3%',
      changeType: 'positive' as const,
      delay: 500
    },
    {
      title: 'Inspections',
      value: stats?.totalInspections || 0,
      icon: Eye,
      color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      gradient: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
      change: '+7%',
      changeType: 'positive' as const,
      delay: 600
    },
    {
      title: 'Teams Active',
      value: stats?.totalTeams || 0,
      icon: Users,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      gradient: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      change: '+2%',
      changeType: 'positive' as const,
      delay: 700
    },
    {
      title: 'Feeder Points',
      value: stats?.totalFeederPoints || 0,
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-teal-500 to-teal-600',
      gradient: 'bg-gradient-to-br from-teal-50 to-teal-100',
      change: '+1%',
      changeType: 'positive' as const,
      delay: 800
    }
  ]

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white"
      >
        <div className="relative z-10">
          <motion.h1 
            className="text-4xl font-bold mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Taskforce Command Center
          </motion.h1>
          <motion.p 
            className="text-xl opacity-90"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Real-time monitoring and management of your entire Taskforce ecosystem
          </motion.p>
        </div>
        
        {/* Animated Background Elements */}
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <AnimatedStatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* System Health & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="card"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Server className="h-6 w-6 mr-2 text-blue-600" />
            System Health
          </h2>
          
          <div className="space-y-6">
            {[
              { label: 'CPU Usage', value: systemHealth.cpu, icon: Cpu, color: 'blue' },
              { label: 'Memory', value: systemHealth.memory, icon: HardDrive, color: 'green' },
              { label: 'Storage', value: systemHealth.storage, icon: Database, color: 'yellow' },
              { label: 'Network', value: systemHealth.network, icon: Wifi, color: 'purple' }
            ].map((item, index) => (
              <div key={item.label} className="flex items-center space-x-4">
                <item.icon className={`h-5 w-5 text-${item.color}-600`} />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full bg-gradient-to-r from-${item.color}-400 to-${item.color}-600`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ delay: 1 + index * 0.1, duration: 1 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="card"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-green-600" />
            Live Activity Feed
          </h2>
          
          <div className="space-y-4 max-h-80 overflow-y-auto">
            <AnimatePresence>
              {recentActivity.slice(0, 8).map((activity, index) => (
                <motion.div
                  key={activity.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
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
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
