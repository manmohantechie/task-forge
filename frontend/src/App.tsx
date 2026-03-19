import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import JobsPage from './pages/JobsPage'
import WorkersPage from './pages/WorkersPage'
import QueuesPage from './pages/QueuesPage'
import CreateJobPage from './pages/CreateJobPage'
import JobDetailPage from './pages/JobDetailPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 5000,
      retry: 2,
      staleTime: 1000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f1117',
              color: '#e2e8f0',
              border: '1px solid #1e293b',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '13px',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/create" element={<CreateJobPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />
            <Route path="workers" element={<WorkersPage />} />
            <Route path="queues" element={<QueuesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
