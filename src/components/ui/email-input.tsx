'use client';

import * as React from 'react';
import { Email, domains, type OnChange, type OnSelect } from '@smastrom/react-email-autocomplete';
import { cn } from '@/shared/lib/utils';

export interface EmailInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'onSelect'
> {
  value?: string;
  onValueChange?: (value: string) => void;
  onSelect?: OnSelect;
  customDomains?: string[];
}

const EmailInput = React.forwardRef<HTMLInputElement, EmailInputProps>(
  ({ className, value, onValueChange, onSelect, customDomains, ...props }, ref) => {
    const handleChange: OnChange = (val: string | ((prev: string) => string)) => {
      onValueChange?.(typeof val === 'function' ? val(value || '') : val);
    };

    return (
      <Email
        ref={ref}
        value={value || ''}
        onChange={handleChange}
        onSelect={onSelect}
        baseList={customDomains || domains}
        className="w-full"
        classNames={{
          input: cn(
            'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            className
          ),
          dropdown:
            'bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 absolute z-50 mt-1 min-w-32 overflow-hidden rounded-md border p-1 shadow-md',
          suggestion:
            'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
        }}
        {...(props as any)}
      />
    );
  }
);

EmailInput.displayName = 'EmailInput';

export { EmailInput };
