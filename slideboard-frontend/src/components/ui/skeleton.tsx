'use client'

import React from 'react'

import { cn } from '@/lib/utils'

type SkeletonVariant = 'rounded' | 'circle'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  variant?: SkeletonVariant
  className?: string
}

export function Skeleton({ width, height, variant = 'rounded', className }: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: variant === 'circle' ? '9999px' : '0.5rem'
  }

  return (
    <div
      style={style}
      className={cn('animate-pulse bg-paper-300', className)}
      aria-hidden="true"
    />
  )
}

export default Skeleton

