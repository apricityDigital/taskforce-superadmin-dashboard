import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/contexts/AuthContext'
import AuthGuard from '@/components/AuthGuard'
import Layout from '@/components/Layout'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  if (router.pathname === '/login') {
    return (
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    )
  }

  return (
    <AuthProvider>
      <AuthGuard>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AuthGuard>
    </AuthProvider>
  )
}