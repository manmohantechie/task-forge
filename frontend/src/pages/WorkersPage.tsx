import { useQuery } from '@tanstack/react-query'
import { systemApi } from '../lib/api'
import { Server, Cpu, CheckCircle2, XCircle, Activity, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function WorkersPage() {
  const { data: workers, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['workers'],
    queryFn: systemApi.workers,
    refetchInterval: 5000,
  })

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Workers</h1>
          <p className="page-sub">Celery worker nodes — last updated {new Date(dataUpdatedAt).toLocaleTimeString()}</p>
        </div>
        <button className="icon-btn" onClick={() => refetch()}><RefreshCw size={15} /></button>
      </header>

      {isLoading ? (
        <div className="page-loading"><div className="spinner" /><span>Discovering workers…</span></div>
      ) : !workers?.length ? (
        <div className="section-card">
          <div className="empty-state">
            <Server size={40} className="empty-icon" />
            <p>No workers connected</p>
            <p className="text-muted text-sm">Start a Celery worker: <code className="inline-code">celery -A app.core.celery_app worker</code></p>
          </div>
        </div>
      ) : (
        <div className="workers-grid">
          {workers.map(w => (
            <div key={w.id} className="worker-card">
              <div className="worker-header">
                <div className="worker-icon-wrap">
                  <Server size={18} />
                </div>
                <div className="worker-title">
                  <span className="worker-name">{w.hostname}</span>
                  <span className={`worker-status ${w.status}`}>
                    {w.status === 'online' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {w.status}
                  </span>
                </div>
              </div>

              <div className="worker-stats">
                <div className="wstat">
                  <span className="wstat-label">Active</span>
                  <span className="wstat-val accent">{w.active_tasks}</span>
                </div>
                <div className="wstat">
                  <span className="wstat-label">Concurrency</span>
                  <span className="wstat-val">{w.concurrency}</span>
                </div>
                <div className="wstat">
                  <span className="wstat-label">Processed</span>
                  <span className="wstat-val">{w.processed_tasks.toLocaleString()}</span>
                </div>
                <div className="wstat">
                  <span className="wstat-label">Failed</span>
                  <span className="wstat-val red">{w.failed_tasks}</span>
                </div>
              </div>

              {/* Load bar */}
              <div className="worker-load">
                <div className="wl-label">
                  <span>Load</span>
                  <span>{w.active_tasks}/{w.concurrency}</span>
                </div>
                <div className="wl-track">
                  <div
                    className="wl-fill"
                    style={{ width: `${Math.min(100, (w.active_tasks / w.concurrency) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Queues */}
              <div className="worker-queues">
                {w.queues.map(q => (
                  <span key={q} className="queue-tag">{q}</span>
                ))}
              </div>

              {w.last_heartbeat && (
                <p className="worker-heartbeat">
                  Last heartbeat: {formatDistanceToNow(new Date(w.last_heartbeat), { addSuffix: true })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
