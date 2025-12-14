import React from 'react'

interface PaperSelectOption {
    value: string
    label: string
}

interface PaperSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    options: PaperSelectOption[]
    label?: string
    error?: string
    loading?: boolean
}

export function PaperSelect({ options, label, error, loading, className = '', disabled, placeholder, ...props }: PaperSelectProps) {
    return (
        <div className="flex flex-col space-y-1">
            {label && (
                <label className="text-sm font-medium text-theme-text-primary">
                    {label}
                </label>
            )}
            <select
                disabled={disabled || loading}
                className={`
          flex h-10 w-full rounded-md border border-theme-border bg-theme-bg-secondary px-3 py-2 text-sm text-theme-text-primary
          ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? 'border-rose-500' : ''}
          ${className}
        `}
                placeholder={placeholder}
                {...props}
            >
                {placeholder && (
                    <option key="placeholder" value="" disabled selected hidden>
                        {placeholder}
                    </option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="text-sm text-rose-500">{error}</p>
            )}
        </div>
    )
}

