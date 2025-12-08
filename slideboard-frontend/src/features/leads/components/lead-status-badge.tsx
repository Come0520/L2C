'use client'


import { LEAD_STATUS_CONFIG } from '@/constants/lead-status'
import { cn } from '@/lib/utils'

interface LeadStatusBadgeProps {
  status: keyof typeof LEAD_STATUS_CONFIG
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function LeadStatusBadge({ status, className, size = 'md' }: LeadStatusBadgeProps) {
  const config = LEAD_STATUS_CONFIG[status]
  if (!config) return null

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        config.bgColor,
        'text-gray-800',
        config.borderColor,
        sizeClasses[size],
        className
      )}
      style={{ color: config.color }}
    >
      {config.label}
    </span>
  )
}