import { useQuery } from '@tanstack/react-query'
import { systemApi } from '../lib/api'
import { GitBranch, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#22d3ee', '#818cf8', '#34d399', '#fbbf24', '#f87171']

export default function QueuesPage() {
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['stats'],
    queryFn: systemApi.stats,
    refetchInterval: 5000,
  })

  const { data: queueLengths } = useQuery({
    queryKey: ['queues'],
    queryFn: systemApi.queues,
    refetchInterval: 3000,
  })

  const queues = stats?.queues ?? []

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Queues</h1>
          <p className="page-sub">Monitor queue depths and throughput</p>
        </div>
        <button className="icon-btn" onClick={() => refetch()}><RefreshCw size={15} /></button>
      </header>

      {/* Bar chart */}
      <div className="section-card">
        <h2 className="section-title">Queue Comparison</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={queues} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#0f1117', border: '1px solid #1e293b', borderRadius: 6, fontSize: 12 }} />
            <Bar dataKey="completed" name="Completed" radius={[3, 3, 0, 0]}>
              {queues.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Queue cards */}
      <div className="queues-grid">
        {queues.map((q, i) => {
          const redisLen = queueLengths?.[q.name] ?? 0
          const utilization = q.active + q.pending > 0
            ? Math.round((q.active / (q.active + q.pending)) * 100) : 0

          return (
            <div key={q.name} className="queue-card">
              <div className="queue-card-header">
                <div className="queue-card-icon" style={{ background: COLORS[i % COLORS.length] + '22', borderColor: COLORS[i % COLORS.length] + '44' }}>
                  <GitBranch size={16} style={{ color: COLORS[i % COLORS.length] }} />
                </div>
                <div>
                  <h3 className="queue-card-name">{q.name}</h3>
                  <p className="queue-card-sub">{redisLen} in Redis broker</p>
                </div>
              </div>

              <div className="queue-stats-row">
                <div className="qstat">
                  <span className="qstat-val" style={{ color: '#fbbf24' }}>{q.pending}</span>
                  <span className="qstat-label">Pending</span>
                </div>
                <div className="qstat">
                  <span className="qstat-val" style={{ color: '#22d3ee' }}>{q.active}</span>
                  <span className="qstat-label">Active</span>
                </div>
                <div className="qstat">
                  <span className="qstat-val" style={{ color: '#34d399' }}>{q.completed.toLocaleString()}</span>
                  <span className="qstat-label">Done</span>
                </div>
                <div className="qstat">
                  <span className="qstat-val" style={{ color: '#f87171' }}>{q.failed}</span>
                  <span className="qstat-label">Failed</span>
                </div>
              </div>

              <div className="queue-bottom">
                <div className="q-util-row">
                  <span className="qstat-label">Utilization</span>
                  <span className="qstat-label">{utilization}%</span>
                </div>
                <div className="wl-track">
                  <div className="wl-fill" style={{ width: `${utilization}%`, background: COLORS[i % COLORS.length] }} />
                </div>
                <div className="q-avg">Avg {q.avg_duration_ms.toFixed(0)}ms / job</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
