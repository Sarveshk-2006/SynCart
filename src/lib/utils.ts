import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind classes safely, resolving conflicts.
 * Use this for all conditional class construction.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format a relative timestamp from an ISO date string.
 * Returns a human-readable "X ago" string.
 */
export function formatRelativeTime(isoDate: string): string {
  const now = new Date()
  const then = new Date(isoDate)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return `${Math.floor(diffHrs / 24)}d ago`
}

/**
 * Format a currency value in USD.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}
