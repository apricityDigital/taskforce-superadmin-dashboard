import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { SuperAdminAuth } from '@/lib/auth'
import SimpleLoginPage from '@/components/SimpleLoginPage'
import Layout from '@/components/Layout'

export default function App({ Component, pageProps }: AppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const authenticated = SuperAdminAuth.isAuthenticated()
      setIsAuthenticated(authenticated)
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleLogin = (email: string, password: string) => {
    const success = SuperAdminAuth.authenticate(email, password)
    if (success) {
      setIsAuthenticated(true)
    }
    return success
  }

  const handleLogout = () => {
    SuperAdminAuth.logout()
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SimpleLoginPage onLogin={handleLogin} />
  }

  return (
    <Layout onLogout={handleLogout}>
      <Component {...pageProps} />
    </Layout>
  )
}
