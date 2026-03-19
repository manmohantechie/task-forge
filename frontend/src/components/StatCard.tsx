import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  accent?: 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'default'
  trend?: number
}

const accents: Record<string, string> = {
  green:   'card-accent-green',
  red:     'card-accent-red',
  amber:   'card-accent-amber',
  blue:    'card-accent-blue',
  purple:  'card-accent-purple',
  default: 'card-accent-default',
}

export default function StatCard({ label, value, sub, icon: Icon, accent = 'default', trend }: Props) {
  return (
    <div className={clsx('stat-card', accents[accent])}>
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <Icon size={16} className="stat-icon" />
      </div>
      <div className="stat-value">{value}</div>
      {(sub || trend !== undefined) && (
        <div className="stat-footer">
          {sub && <span className="stat-sub">{sub}</span>}
          {trend !== undefined && (
            <span className={clsx('stat-trend', trend >= 0 ? 'trend-up' : 'trend-down')}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}
