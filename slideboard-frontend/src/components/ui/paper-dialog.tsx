'use client'

import * as React from 'react'

import { cn } from '@/utils/lib-utils'

const PaperDialog = ({
  children,
  open,
  onOpenChange,
  className,
}: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={cn("bg-theme-bg-secondary rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200", className)}>
        {children}
      </div>
      <div
        className="absolute inset-0 -z-10"
        onClick={() => onOpenChange?.(false)}
      />
    </div>
  )
}

const PaperDialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('relative px-6 py-4', className)}
    {...props}
  >
    {children}
  </div>
))
PaperDialogContent.displayName = 'PaperDialogContent'

const PaperDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-2',
      className
    )}
    {...props}
  />
)
PaperDialogHeader.displayName = 'PaperDialogHeader'

const PaperDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-2',
      className
    )}
    {...props}
  />
)
PaperDialogFooter.displayName = 'PaperDialogFooter'

const PaperDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
))
PaperDialogTitle.displayName = 'PaperDialogTitle'

const PaperDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
PaperDialogDescription.displayName = 'PaperDialogDescription'

export {
  PaperDialog,
  PaperDialogContent,
  PaperDialogHeader,
  PaperDialogFooter,
  PaperDialogTitle,
  PaperDialogDescription,
}
