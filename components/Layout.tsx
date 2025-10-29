import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  MessageSquare,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  FileText,
  BarChart3
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Access Requests', href: '/access-requests', icon: UserCheck },
  { name: 'Feeder Points', href: '/feeder-points', icon: Activity },
  { name: 'Daily Reports', href: '/daily-reports', icon: FileText },
  { name: 'Employee Tracker', href: '/employee-tracker', icon: BarChart3 },
  { name: 'Complaints', href: '/complaints', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-gray-600 hover:bg-gray-700 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent currentPath={router.pathname} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <SidebarContent currentPath={router.pathname} />
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-0">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow-lg">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden hover:bg-gray-50 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 sm:px-6 flex justify-between items-center">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 truncate">
                Taskforce Command Center
              </h1>
              <p className="hidden sm:block text-xs text-gray-500">
                Apricity Digital Labs · Operational Oversight
              </p>
            </div>

            <div className="ml-4 flex items-center space-x-2 sm:space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-2 sm:px-3 py-2 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
            <span>
              Powered by <span className="font-semibold text-gray-700">Apricity Digital Labs</span>
            </span>
            <span className="mt-2 sm:mt-0">© {new Date().getFullYear()} All rights reserved.</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

function SidebarContent({ currentPath }: { currentPath: string }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="px-6">
          {/* <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-500">Apricity Digital Labs</p> */}
          <p className="text-lg font-semibold text-gray-900">Taskforce SuperAdmin</p>   
        </div>

        <nav className="mt-8 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = currentPath === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`sidebar-link ${
                  isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex-shrink-0 px-4 py-6 border-t border-gray-200">
        <div className="rounded-2xl bg-gray-50 p-4 text-center shadow-sm">
          <img
            src="/Logo_Apricity.png"
            alt="Apricity Digital Labs logo"
            className="mx-auto h-16 w-auto"
            draggable={false}
          />
          {/* <p className="mt-3 text-xs uppercase tracking-[0.3em] font-semibold">
           Apricity Digital Labs
          </p> */}
          <p className="mt-3 text-xs uppercase tracking-[0.3em] font-semibold text-gray-700">
             Apricity Digital Labs
          </p>
        </div>
      </div>
    </div>
  )
}
