import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

export type JobStatus = 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'RETRY' | 'REVOKED'
export type JobPriority = 'high' | 'default' | 'low'

export interface Job {
  id: string
  task_id: string | null
  name: string
  task_name: string
  queue: string
  priority: JobPriority
  status: JobStatus
  args: unknown[]
  kwargs: Record<string, unknown>
  result: unknown | null
  error: string | null
  retries: number
  max_retries: number
  progress: number
  meta: Record<string, unknown>
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface JobList {
  items: Job[]
  total: number
  page: number
  page_size: number
}

export interface JobCreate {
  name: string
  task_name: string
  queue: string
  priority: JobPriority
  args?: unknown[]
  kwargs?: Record<string, unknown>
  max_retries?: number
  scheduled_at?: string | null
  meta?: Record<string, unknown>
}

export interface QueueInfo {
  name: string
  pending: number
  active: number
  completed: number
  failed: number
  avg_duration_ms: number
}

export interface DashboardStats {
  total_jobs: number
  pending_jobs: number
  active_jobs: number
  completed_jobs: number
  failed_jobs: number
  success_rate: number
  avg_duration_ms: number
  workers_online: number
  queues: QueueInfo[]
}

export interface Worker {
  id: string
  hostname: string
  status: string
  queues: string[]
  concurrency: number
  active_tasks: number
  processed_tasks: number
  failed_tasks: number
  last_heartbeat: string | null
}

export interface TaskDef {
  name: string
  full_name: string
}

// ─── API Functions ─────────────────────────────────────────────────────────────

export const jobsApi = {
  list: (params: { page?: number; page_size?: number; status?: string; queue?: string; search?: string }) =>
    api.get<JobList>('/api/v1/jobs/', { params }).then(r => r.data),

  get: (id: string) =>
    api.get<Job>(`/api/v1/jobs/${id}`).then(r => r.data),

  create: (data: JobCreate) =>
    api.post<Job>('/api/v1/jobs/', data).then(r => r.data),

  retry: (id: string) =>
    api.post<Job>(`/api/v1/jobs/${id}/retry`).then(r => r.data),

  revoke: (id: string, terminate = false) =>
    api.delete(`/api/v1/jobs/${id}`, { params: { terminate } }),

  bulkCreate: (jobs: JobCreate[]) =>
    api.post<Job[]>('/api/v1/jobs/bulk/create', { jobs }).then(r => r.data),
}

export const systemApi = {
  stats: () => api.get<DashboardStats>('/api/v1/stats').then(r => r.data),
  workers: () => api.get<Worker[]>('/api/v1/workers').then(r => r.data),
  queues: () => api.get<Record<string, number>>('/api/v1/queues').then(r => r.data),
  registry: () => api.get<TaskDef[]>('/api/v1/tasks/registry').then(r => r.data),
  health: () => api.get('/api/v1/health').then(r => r.data),
}

export default api
