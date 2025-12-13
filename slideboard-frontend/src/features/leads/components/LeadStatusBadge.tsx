'use client'


import { cva, type VariantProps } from 'class-variance-authority'

import { LEAD_STATUS_CONFIG } from '@/constants/lead-status'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium border text-gray-800',
  {
    variants: {
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

interface LeadStatusBadgeProps extends VariantProps<typeof badgeVariants> {
  status: string
  className?: string
}

export default function LeadStatusBadge({ status, className, size }: LeadStatusBadgeProps) {
  const config = LEAD_STATUS_CONFIG[status as keyof typeof LEAD_STATUS_CONFIG]
  if (!config) return null

  return (
    <span
      className={cn(
        badgeVariants({ size }),
        config.bgColor,
        config.borderColor,
        className
      )}
      style={{ color: config.color }}
    >
      {config.label}
    </span>
  )
}