import clsx from 'clsx'

interface Props {
  value: number  // 0-100
  status?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export default function ProgressBar({ value, status, showLabel = false, size = 'md' }: Props) {
  const pct = Math.min(100, Math.max(0, value))
  const colorCls = status === 'FAILURE' ? 'bar-failed'
    : status === 'SUCCESS' ? 'bar-success'
    : status === 'STARTED' ? 'bar-running'
    : 'bar-default'

  return (
    <div className="progress-wrap">
      <div className={clsx('progress-track', size === 'sm' ? 'track-sm' : 'track-md')}>
        <div
          className={clsx('progress-fill', colorCls)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="progress-label">{pct.toFixed(0)}%</span>}
    </div>
  )
}
