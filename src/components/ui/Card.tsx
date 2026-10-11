/**
 * Card — a contained surface with optional header and footer.
 */
import { cn } from '@/lib/utils'
import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'section'
}

interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export function Card({ children, className, as: Tag = 'div', ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        'bg-white rounded-xl border border-slate-200/90 shadow-[var(--shadow-card)]',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({ children, className, ...props }: CardSectionProps) {
  return (
    <div
      className={cn('px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardBody({ children, className, ...props }: CardSectionProps) {
  return (
    <div className={cn('px-5 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }: CardSectionProps) {
  return (
    <div
      className={cn('px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl', className)}
      {...props}
    >
      {children}
    </div>
  )
}
