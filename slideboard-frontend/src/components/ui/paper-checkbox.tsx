'use client';

import React from 'react';

import { cn } from '@/utils/lib-utils';

interface PaperCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckedChange?: (checked: boolean) => void;
}

export const PaperCheckbox = React.forwardRef<HTMLInputElement, PaperCheckboxProps>(
  ({ className, label, error, helperText, fullWidth = true, onChange, onCheckedChange, ...props }, ref) => {
    const checkboxClasses = cn(
      'paper-checkbox',
      error && 'border-error-500 focus:ring-error-400 focus:border-error-400',
      className
    );
    
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(event);
      }
      if (onCheckedChange) {
        onCheckedChange(event.target.checked);
      }
    };
    
    return (
      <div className={cn(fullWidth && 'w-full')}>
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            ref={ref}
            className={checkboxClasses}
            onChange={handleChange}
            {...props}
          />
          {label && (
            <label htmlFor={props.id} className="text-sm font-medium text-ink-600 mt-0.5">
              {label}
              {props.required && <span className="text-error-500 ml-1">*</span>}
            </label>
          )}
        </div>
        {error && (
          <p className="text-sm text-error-600 mt-1 ml-6">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-ink-500 mt-1 ml-6">{helperText}</p>
        )}
      </div>
    );
  }
);

PaperCheckbox.displayName = 'PaperCheckbox';
