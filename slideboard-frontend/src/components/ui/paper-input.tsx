'use client';

import React from 'react';

import { cn } from '@/utils/lib-utils';

interface PaperInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const PaperInput = React.forwardRef<HTMLInputElement, PaperInputProps>(
  ({ className, label, error, helperText, fullWidth = true, icon, ...props }, ref) => {
    const inputClasses = cn(
      'paper-input',
      fullWidth && 'w-full',
      error && 'border-error-500 focus:ring-error-400 focus:border-error-400',
      icon && 'pl-10',
      className
    );
    
    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-ink-600">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 flex items-center">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={inputClasses}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-error-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-ink-500">{helperText}</p>
        )}
      </div>
    );
  }
);

PaperInput.displayName = 'PaperInput';

interface PaperTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  rows?: number;
}

export const PaperTextarea = React.forwardRef<HTMLTextAreaElement, PaperTextareaProps>(
  ({ className, label, error, helperText, fullWidth = true, rows = 4, ...props }, ref) => {
    const textareaClasses = cn(
      'paper-textarea',
      fullWidth && 'w-full',
      error && 'border-error-500 focus:ring-error-400 focus:border-error-400',
      className
    );
    
    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-ink-600">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={textareaClasses}
          {...props}
        />
        {error && (
          <p className="text-sm text-error-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-ink-500">{helperText}</p>
        )}
      </div>
    );
  }
);

PaperTextarea.displayName = 'PaperTextarea';

interface PaperSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const PaperSelect = React.forwardRef<HTMLSelectElement, PaperSelectProps>(
  ({ className, label, error, helperText, fullWidth = true, options, placeholder, ...props }, ref) => {
    const selectClasses = cn(
      'paper-select',
      fullWidth && 'w-full',
      error && 'border-error-500 focus:ring-error-400 focus:border-error-400',
      className
    );
    
    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-ink-600">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={selectClasses}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-error-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-ink-500">{helperText}</p>
        )}
      </div>
    );
  }
);

PaperSelect.displayName = 'PaperSelect';
