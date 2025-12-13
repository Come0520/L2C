'use client'

import { motion } from 'framer-motion'
import React from 'react'

import { cn } from '@/lib/utils'

type SkeletonVariant = 'rounded' | 'circle'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  variant?: SkeletonVariant
}

export function Skeleton({ 
  width, 
  height, 
  variant = 'rounded', 
  className, 
  ...props 
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div
      style={style}
      className={cn(
        'relative overflow-hidden bg-paper-300',
        variant === 'circle' ? 'rounded-full' : 'rounded-md',
        className
      )}
      aria-hidden="true"
      {...props}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full"
        animate={{ transform: ['translateX(-100%)', 'translateX(100%)'] }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear',
        }}
      >
        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </motion.div>
    </div>
  )
}

export default Skeleton

