'use client'

import { BUSINESS_TAG_CONFIG, CUSTOMER_LEVEL_CONFIG } from '@/constants/lead-status'
import { cn } from '@/lib/utils'

interface BusinessTagProps {
  tag: keyof typeof BUSINESS_TAG_CONFIG
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

interface CustomerLevelTagProps {
  level: keyof typeof CUSTOMER_LEVEL_CONFIG
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function BusinessTag({ tag, className, size = 'md' }: BusinessTagProps) {
  const config = BUSINESS_TAG_CONFIG[tag]
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
    >
      {config.label}
    </span>
  )
}

export function CustomerLevelTag({ level, className, size = 'md' }: CustomerLevelTagProps) {
  const config = CUSTOMER_LEVEL_CONFIG[level]
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
    >
      {config.label}
    </span>
  )
}

interface BusinessTagsListProps {
  tags: Array<keyof typeof BUSINESS_TAG_CONFIG>
  className?: string
}

export function BusinessTagsList({ tags, className }: BusinessTagsListProps) {
  if (!tags || tags.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag, index) => (
        <BusinessTag key={index} tag={tag} />
      ))}
    </div>
  )
}