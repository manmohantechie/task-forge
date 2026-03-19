import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { jobsApi } from '../lib/api'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'
import { Search, Plus, RefreshCw, X, RotateCcw, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const STATUSES = ['', 'PENDING', 'STARTED', 'SUCCESS', 'FAILURE', 'RETRY', 'REVOKED']
const QUEUES = ['', 'high', 'default', 'low', 'email', 'analytics']

export default function JobsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [queue, setQueue] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['jobs', { page, status, queue, search }],
    queryFn: () => jobsApi.list({ page, page_size: 20, status: status || undefined, queue: queue || undefined, search: search || undefined }),
    refetchInterval: 5000,
  })

  const retryMutation = useMutation({
    mutationFn: jobsApi.retry,
    onSuccess: () => {
      toast.success('Job re-queued')
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: () => toast.error('Failed to retry job'),
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => jobsApi.revoke(id),
    onSuccess: () => {
      toast.success('Job revoked')
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: () => toast.error('Failed to revoke job'),
  })

  const totalPages = data ? Math.ceil(data.total / 20) : 1

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Jobs</h1>
          <p className="page-sub">{data?.total ?? 0} total jobs</p>
        </div>
        <div className="header-actions">
          <button onClick={() => refetch()} className="icon-btn" title="Refresh">
            <RefreshCw size={15} />
          </button>
          <Link to="/jobs/create" className="primary-btn">
            <Plus size={14} />
            New Job
          </Link>
        </div>
      </header>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-wrap">
          <Search size={14} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search jobs…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          {search && <button className="clear-btn" onClick={() => setSearch('')}><X size={12} /></button>}
        </div>
        <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <select className="filter-select" value={queue} onChange={e => { setQueue(e.target.value); setPage(1) }}>
          {QUEUES.map(q => <option key={q} value={q}>{q || 'All Queues'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="section-card no-pad">
        <div className="jobs-table">
          <div className="table-head cols-6">
            <span>Name</span>
            <span>Task</span>
            <span>Queue / Priority</span>
            <span>Status</span>
            <span>Progress</span>
            <span>Actions</span>
          </div>

          {isLoading ? (
            <div className="table-loading">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton-row" />
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="empty-state">
              <p>No jobs found</p>
              <Link to="/jobs/create" className="primary-btn sm">Create First Job</Link>
            </div>
          ) : (
            data?.items.map(job => (
              <div key={job.id} className="table-row cols-6">
                <span className="job-name-cell">
                  <span className="job-name">{job.name}</span>
                  <span className="job-id">{job.id.slice(0, 8)}…</span>
                </span>
                <span className="task-tag">{job.task_name.split('.').pop()}</span>
                <span>
                  <span className="queue-tag">{job.queue}</span>
                  <span className={`priority-dot p-${job.priority}`}>{job.priority}</span>
                </span>
                <span><StatusBadge status={job.status} /></span>
                <span className="progress-cell">
                  <ProgressBar value={job.progress} status={job.status} size="sm" showLabel />
                </span>
                <span className="action-btns">
                  <Link to={`/jobs/${job.id}`} className="action-btn" title="View">
                    <Eye size={13} />
                  </Link>
                  {job.status === 'FAILURE' && (
                    <button
                      className="action-btn green"
                      title="Retry"
                      onClick={() => retryMutation.mutate(job.id)}
                      disabled={retryMutation.isPending}
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}
                  {(job.status === 'PENDING' || job.status === 'STARTED') && (
                    <button
                      className="action-btn red"
                      title="Revoke"
                      onClick={() => revokeMutation.mutate(job.id)}
                      disabled={revokeMutation.isPending}
                    >
                      <X size={13} />
                    </button>
                  )}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="page-btn">← Prev</button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="page-btn">Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
