import * as React from "react"

import { cn } from "@/utils/lib-utils"

export interface PaperTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const PaperTextarea = React.forwardRef<HTMLTextAreaElement, PaperTextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1">
        {label && (
          <label className="text-sm font-medium text-theme-text-primary">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-theme-border bg-theme-bg-secondary px-3 py-2 text-sm text-theme-text-primary ring-offset-background placeholder:text-theme-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-rose-500" : "",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-rose-500">{error}</p>
        )}
      </div>
    )
  }
)
PaperTextarea.displayName = "PaperTextarea"

export { PaperTextarea }

