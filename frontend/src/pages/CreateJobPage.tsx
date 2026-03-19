import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { jobsApi, systemApi } from '../lib/api'
import { ArrowLeft, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const TASK_DEFAULTS: Record<string, { args: unknown[]; kwargs: Record<string, unknown> }> = {
  send_email: { args: [], kwargs: { to: 'user@example.com', subject: 'Hello', body: 'Test email body', template: 'default' } },
  send_bulk_email: { args: [], kwargs: { recipients: ['a@x.com', 'b@x.com'], subject: 'Campaign', body: 'Hello!' } },
  generate_report: { args: [], kwargs: { report_type: 'sales', date_range: { start: '2024-01-01', end: '2024-12-31' }, filters: {} } },
  compute_aggregates: { args: [], kwargs: { dataset: 'events', dimensions: ['country', 'device'], metrics: ['sessions', 'revenue'] } },
  process_csv: { args: [], kwargs: { file_path: '/data/uploads/users.csv', options: { delimiter: ',' } } },
  transcode_video: { args: [], kwargs: { input_url: 'https://cdn.example.com/raw.mp4', output_format: 'mp4', quality: '720p' } },
  generate_thumbnail: { args: [], kwargs: { image_url: 'https://cdn.example.com/photo.jpg', sizes: ['64x64', '128x128', '256x256'] } },
  export_data: { args: [], kwargs: { query: { table: 'orders', since: '2024-01-01' }, format: 'csv', destination: 's3' } },
}

export default function CreateJobPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: registry } = useQuery({ queryKey: ['registry'], queryFn: systemApi.registry })

  const [form, setForm] = useState({
    name: '',
    task_name: '',
    queue: 'default',
    priority: 'default' as 'high' | 'default' | 'low',
    max_retries: 3,
    kwargs_raw: '{}',
    args_raw: '[]',
    scheduled_at: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: jobsApi.create,
    onSuccess: (job) => {
      toast.success('Job dispatched!')
      qc.invalidateQueries({ queryKey: ['jobs'] })
      navigate(`/jobs/${job.id}`)
    },
    onError: () => toast.error('Failed to create job'),
  })

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const onTaskSelect = (taskName: string) => {
    const def = TASK_DEFAULTS[taskName]
    set('task_name', taskName)
    if (def) {
      setForm(f => ({
        ...f,
        task_name: taskName,
        kwargs_raw: JSON.stringify(def.kwargs, null, 2),
        args_raw: JSON.stringify(def.args, null, 2),
        name: f.name || taskName.replace(/_/g, ' '),
      }))
    }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.task_name) e.task_name = 'Select a task'
    try { JSON.parse(form.kwargs_raw) } catch { e.kwargs = 'Invalid JSON' }
    try { JSON.parse(form.args_raw) } catch { e.args = 'Invalid JSON' }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = () => {
    if (!validate()) return
    mutation.mutate({
      name: form.name,
      task_name: form.task_name,
      queue: form.queue,
      priority: form.priority,
      max_retries: form.max_retries,
      kwargs: JSON.parse(form.kwargs_raw),
      args: JSON.parse(form.args_raw),
      scheduled_at: form.scheduled_at || null,
    })
  }

  return (
    <div className="page narrow">
      <header className="page-header">
        <div className="back-row">
          <button className="back-btn" onClick={() => navigate('/jobs')}><ArrowLeft size={15} /></button>
          <div>
            <h1 className="page-title">Dispatch New Job</h1>
            <p className="page-sub">Configure and queue a background task</p>
          </div>
        </div>
      </header>

      <div className="form-card">
        {/* Task selector */}
        <div className="form-section">
          <h3 className="form-section-title">Task Type</h3>
          <div className="task-grid">
            {registry?.map(t => (
              <button
                key={t.name}
                className={`task-option ${form.task_name === t.name ? 'selected' : ''}`}
                onClick={() => onTaskSelect(t.name)}
              >
                <Zap size={12} />
                <span className="task-opt-name">{t.name.replace(/_/g, ' ')}</span>
                <span className="task-opt-cat">{t.full_name.split(':')[0]}</span>
              </button>
            ))}
          </div>
          {errors.task_name && <p className="field-error">{errors.task_name}</p>}
        </div>

        {/* Basic info */}
        <div className="form-section">
          <h3 className="form-section-title">Job Details</h3>
          <div className="field-group">
            <label className="field-label">Job Name *</label>
            <input className={`field-input ${errors.name ? 'error' : ''}`} value={form.name}
              onChange={e => set('name', e.target.value)} placeholder="e.g. Weekly Report" />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Queue</label>
              <select className="field-input" value={form.queue} onChange={e => set('queue', e.target.value)}>
                {['high', 'default', 'low', 'email', 'analytics'].map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Priority</label>
              <select className="field-input" value={form.priority} onChange={e => set('priority', e.target.value as 'high' | 'default' | 'low')}>
                {['high', 'default', 'low'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Max Retries</label>
              <input type="number" className="field-input" value={form.max_retries} min={0} max={10}
                onChange={e => set('max_retries', parseInt(e.target.value))} />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Schedule At (optional)</label>
            <input type="datetime-local" className="field-input" value={form.scheduled_at}
              onChange={e => set('scheduled_at', e.target.value)} />
          </div>
        </div>

        {/* Parameters */}
        <div className="form-section">
          <h3 className="form-section-title">Parameters</h3>
          <div className="field-group">
            <label className="field-label">Keyword Arguments (JSON)</label>
            <textarea className={`field-input code-area ${errors.kwargs ? 'error' : ''}`}
              rows={8} value={form.kwargs_raw}
              onChange={e => set('kwargs_raw', e.target.value)} spellCheck={false} />
            {errors.kwargs && <p className="field-error">{errors.kwargs}</p>}
          </div>
          <div className="field-group">
            <label className="field-label">Positional Args (JSON array)</label>
            <textarea className={`field-input code-area ${errors.args ? 'error' : ''}`}
              rows={2} value={form.args_raw}
              onChange={e => set('args_raw', e.target.value)} spellCheck={false} />
            {errors.args && <p className="field-error">{errors.args}</p>}
          </div>
        </div>

        <div className="form-actions">
          <button className="outline-btn" onClick={() => navigate('/jobs')}>Cancel</button>
          <button className="primary-btn large" onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Dispatching…' : '⚡ Dispatch Job'}
          </button>
        </div>
      </div>
    </div>
  )
}
