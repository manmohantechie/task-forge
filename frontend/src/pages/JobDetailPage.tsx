import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../lib/api'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'
import { ArrowLeft, RotateCcw, X, Clock, Server, Activity } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.get(id!),
    refetchInterval: job => job?.status === 'STARTED' ? 2000 : 10000,
    enabled: !!id,
  })

  const retryMutation = useMutation({
    mutationFn: () => jobsApi.retry(id!),
    onSuccess: () => { toast.success('Job re-queued'); qc.invalidateQueries({ queryKey: ['job', id] }) },
    onError: () => toast.error('Retry failed'),
  })

  const revokeMutation = useMutation({
    mutationFn: () => jobsApi.revoke(id!),
    onSuccess: () => { toast.success('Job revoked'); navigate('/jobs') },
    onError: () => toast.error('Revoke failed'),
  })

  if (isLoading) return <div className="page-loading"><div className="spinner" /><span>Loading job…</span></div>
  if (!job) return <div className="page"><p className="error-text">Job not found.</p></div>

  const duration = job.started_at && job.completed_at
    ? ((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000).toFixed(2)
    : null

  return (
    <div className="page">
      <header className="page-header">
        <div className="back-row">
          <button className="back-btn" onClick={() => navigate('/jobs')}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 className="page-title">{job.name}</h1>
            <p className="page-sub mono">{job.id}</p>
          </div>
        </div>
        <div className="header-actions">
          {job.status === 'FAILURE' && (
            <button className="primary-btn green" onClick={() => retryMutation.mutate()} disabled={retryMutation.isPending}>
              <RotateCcw size={14} /> Retry
            </button>
          )}
          {(job.status === 'PENDING' || job.status === 'STARTED') && (
            <button className="primary-btn red" onClick={() => revokeMutation.mutate()} disabled={revokeMutation.isPending}>
              <X size={14} /> Revoke
            </button>
          )}
        </div>
      </header>

      <div className="detail-grid">
        {/* Progress panel */}
        <div className="detail-card full-width">
          <div className="detail-row-header">
            <StatusBadge status={job.status} />
            <span className="mono text-sm text-muted">{job.task_name}</span>
          </div>
          <div className="progress-section">
            <div className="progress-label-row">
              <span>Progress</span>
              <span>{job.progress.toFixed(0)}%</span>
            </div>
            <ProgressBar value={job.progress} status={job.status} size="md" />
          </div>
        </div>

        {/* Info cards */}
        <div className="detail-card">
          <h3 className="detail-card-title"><Server size={14} /> Execution Info</h3>
          <dl className="info-list">
            <div className="info-item">
              <dt>Queue</dt><dd className="queue-tag">{job.queue}</dd>
            </div>
            <div className="info-item">
              <dt>Priority</dt><dd className={`priority-dot p-${job.priority}`}>{job.priority}</dd>
            </div>
            <div className="info-item">
              <dt>Retries</dt><dd>{job.retries} / {job.max_retries}</dd>
            </div>
            {duration && (
              <div className="info-item">
                <dt>Duration</dt><dd>{duration}s</dd>
              </div>
            )}
            {job.task_id && (
              <div className="info-item">
                <dt>Celery Task ID</dt><dd className="mono text-xs truncate">{job.task_id}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="detail-card">
          <h3 className="detail-card-title"><Clock size={14} /> Timeline</h3>
          <div className="timeline">
            {[
              { label: 'Created', val: job.created_at },
              { label: 'Scheduled', val: job.scheduled_at },
              { label: 'Started', val: job.started_at },
              { label: 'Completed', val: job.completed_at },
            ].map(({ label, val }) => val && (
              <div key={label} className="timeline-item">
                <span className="tl-dot" />
                <div>
                  <span className="tl-label">{label}</span>
                  <span className="tl-time">{format(new Date(val), 'MMM d, HH:mm:ss')}</span>
                  <span className="tl-rel">({formatDistanceToNow(new Date(val), { addSuffix: true })})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Args / Result */}
        {(job.args?.length > 0 || Object.keys(job.kwargs || {}).length > 0) && (
          <div className="detail-card">
            <h3 className="detail-card-title"><Activity size={14} /> Parameters</h3>
            {job.args?.length > 0 && (
              <>
                <p className="code-label">Args</p>
                <pre className="code-block">{JSON.stringify(job.args, null, 2)}</pre>
              </>
            )}
            {Object.keys(job.kwargs || {}).length > 0 && (
              <>
                <p className="code-label">Kwargs</p>
                <pre className="code-block">{JSON.stringify(job.kwargs, null, 2)}</pre>
              </>
            )}
          </div>
        )}

        {job.result && (
          <div className="detail-card">
            <h3 className="detail-card-title success-text">Result</h3>
            <pre className="code-block success">{JSON.stringify(job.result, null, 2)}</pre>
          </div>
        )}

        {job.error && (
          <div className="detail-card">
            <h3 className="detail-card-title error-text">Error</h3>
            <pre className="code-block error">{job.error}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
