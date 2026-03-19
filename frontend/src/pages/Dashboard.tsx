import { useQuery } from '@tanstack/react-query'
import { systemApi, jobsApi } from '../lib/api'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import ProgressBar from '../components/ProgressBar'
import { CheckCircle2, XCircle, Clock, Cpu, Activity, Users, Zap, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { Link } from 'react-router-dom'

const THROUGHPUT_DATA = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  completed: Math.floor(Math.random() * 400 + 50),
  failed: Math.floor(Math.random() * 30),
}))

const QUEUE_COLORS = ['#22d3ee', '#818cf8', '#34d399', '#fbbf24', '#f87171']

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: systemApi.stats,
    refetchInterval: 4000,
  })

  const { data: jobs } = useQuery({
    queryKey: ['jobs', { page: 1, page_size: 8 }],
    queryFn: () => jobsApi.list({ page: 1, page_size: 8 }),
    refetchInterval: 4000,
  })

  if (isLoading || !stats) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <span>Loading system data…</span>
      </div>
    )
  }

  const queuePieData = stats.queues.map(q => ({
    name: q.name,
    value: q.pending + q.active,
  }))

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">System Dashboard</h1>
          <p className="page-sub">Real-time overview of distributed job processing</p>
        </div>
        <div className="live-badge">
          <span className="dot green pulse" />
          <span>Live</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard label="Total Jobs" value={stats.total_jobs.toLocaleString()} icon={Activity} accent="blue" sub="all time" />
        <StatCard label="Running" value={stats.active_jobs} icon={Cpu} accent="amber" sub="active now" />
        <StatCard label="Completed" value={stats.completed_jobs.toLocaleString()} icon={CheckCircle2} accent="green" trend={2.4} />
        <StatCard label="Failed" value={stats.failed_jobs} icon={XCircle} accent="red" sub="needs attention" />
        <StatCard label="Success Rate" value={`${stats.success_rate.toFixed(1)}%`} icon={TrendingUp} accent="green" />
        <StatCard label="Avg Duration" value={`${(stats.avg_duration_ms / 1000).toFixed(2)}s`} icon={Clock} accent="purple" />
        <StatCard label="Pending" value={stats.pending_jobs} icon={Clock} accent="amber" sub="in queue" />
        <StatCard label="Workers Online" value={stats.workers_online} icon={Users} accent="blue" />
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Throughput chart */}
        <div className="chart-card wide">
          <div className="chart-header">
            <h2 className="chart-title">Job Throughput (24h)</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={THROUGHPUT_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cgComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cgFail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0f1117', border: '1px solid #1e293b', borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="completed" stroke="#22d3ee" fill="url(#cgComp)" strokeWidth={2} name="Completed" />
              <Area type="monotone" dataKey="failed" stroke="#f87171" fill="url(#cgFail)" strokeWidth={2} name="Failed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Queue distribution */}
        <div className="chart-card narrow">
          <div className="chart-header">
            <h2 className="chart-title">Queue Load</h2>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={queuePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {queuePieData.map((_, i) => (
                  <Cell key={i} fill={QUEUE_COLORS[i % QUEUE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0f1117', border: '1px solid #1e293b', borderRadius: 6, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="queue-legend">
            {queuePieData.map((q, i) => (
              <div key={q.name} className="legend-item">
                <span className="legend-dot" style={{ background: QUEUE_COLORS[i] }} />
                <span className="legend-label">{q.name}</span>
                <span className="legend-val">{q.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">Recent Jobs</h2>
          <Link to="/jobs" className="view-all-link">View all →</Link>
        </div>
        <div className="jobs-table">
          <div className="table-head">
            <span>Job Name</span>
            <span>Queue</span>
            <span>Status</span>
            <span>Progress</span>
            <span>Created</span>
          </div>
          {jobs?.items.map(job => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="table-row">
              <span className="job-name">
                <Zap size={12} className="job-icon" />
                {job.name}
              </span>
              <span className="queue-tag">{job.queue}</span>
              <span><StatusBadge status={job.status} /></span>
              <span className="progress-cell">
                <ProgressBar value={job.progress} status={job.status} size="sm" showLabel />
              </span>
              <span className="time-cell">
                {job.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) : '—'}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
