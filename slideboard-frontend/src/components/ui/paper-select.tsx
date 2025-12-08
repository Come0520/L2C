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

export function PaperSelect({ options, label, error, loading, className = '', disabled, ...props }: PaperSelectProps) {
    return (
        <div className="flex flex-col space-y-1">
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <select
                disabled={disabled || loading}
                className={`
          flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm 
          ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    )
}
