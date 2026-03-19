import clsx from 'clsx'
import type { JobStatus } from '../lib/api'

const cfg: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'Pending',  cls: 'badge-pending'  },
  STARTED:  { label: 'Running',  cls: 'badge-running'  },
  SUCCESS:  { label: 'Success',  cls: 'badge-success'  },
  FAILURE:  { label: 'Failed',   cls: 'badge-failed'   },
  RETRY:    { label: 'Retrying', cls: 'badge-retry'    },
  REVOKED:  { label: 'Revoked',  cls: 'badge-revoked'  },
}

export default function StatusBadge({ status }: { status: string }) {
  const c = cfg[status] ?? { label: status, cls: 'badge-pending' }
  return <span className={clsx('badge', c.cls)}>{c.label}</span>
}
