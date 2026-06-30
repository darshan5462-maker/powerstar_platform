import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/globals.css'
import { useThemeStore } from './store/themeStore'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 5*60*1000, retry: 1 } } })

function Root() {
  const { dark } = useThemeStore()
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" toastOptions={{
          style: { background:'var(--card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:'12px', fontSize:'14px', fontFamily:'Inter,sans-serif' },
          success: { iconTheme: { primary:'#f97316', secondary:'#fff' } },
          duration: 3000,
        }} />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Root /></React.StrictMode>)
