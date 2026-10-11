/**
 * StatusBadge — semantic session/verification status display.
 * Centralizes all status → Badge variant mappings.
 */
import { Badge } from './Badge'
import type { SessionStatus, VerificationStatus, Priority } from '@/types/domain'

const sessionStatusConfig: Record<SessionStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'default' }> = {
  active:       { label: 'Active',       variant: 'info' },
  reconciling:  { label: 'Reconciling', variant: 'warning' },
  reconciled:   { label: 'Reconciled',  variant: 'success' },
  mismatch:     { label: 'Mismatch',    variant: 'danger' },
  exited:       { label: 'Exited',      variant: 'muted' },
}

const verificationStatusConfig: Record<VerificationStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'default' }> = {
  pending:   { label: 'Pending',    variant: 'warning' },
  in_review: { label: 'In Review', variant: 'info' },
  resolved:  { label: 'Resolved',  variant: 'success' },
  escalated: { label: 'Escalated', variant: 'danger' },
}

const priorityConfig: Record<Priority, { label: string; variant: 'danger' | 'warning' | 'muted' }> = {
  high:   { label: 'High',   variant: 'danger' },
  medium: { label: 'Medium', variant: 'warning' },
  low:    { label: 'Low',    variant: 'muted' },
}

interface SessionStatusBadgeProps { status: SessionStatus; dot?: boolean }
interface VerificationStatusBadgeProps { status: VerificationStatus; dot?: boolean }
interface PriorityBadgeProps { priority: Priority }

export function SessionStatusBadge({ status, dot }: SessionStatusBadgeProps) {
  const { label, variant } = sessionStatusConfig[status]
  return <Badge variant={variant} dot={dot}>{label}</Badge>
}

export function VerificationStatusBadge({ status, dot }: VerificationStatusBadgeProps) {
  const { label, variant } = verificationStatusConfig[status]
  return <Badge variant={variant} dot={dot}>{label}</Badge>
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { label, variant } = priorityConfig[priority]
  return <Badge variant={variant}>{label}</Badge>
}
