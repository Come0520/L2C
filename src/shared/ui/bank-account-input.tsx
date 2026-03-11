'use client';

import * as React from 'react';
import { PatternFormat, type PatternFormatProps } from 'react-number-format';
import { cn } from '@/shared/lib/utils';

export interface BankAccountInputProps extends Omit<PatternFormatProps, 'customInput'> {
  className?: string;
}

const BankAccountInput = React.forwardRef<HTMLInputElement, BankAccountInputProps>(
  ({ className, format, ...props }, ref) => {
    return (
      <PatternFormat
        getInputRef={ref}
        format={format || '#### #### #### #######'}
        inputMode="numeric"
        className={cn(
          'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        mask="_"
        {...props}
      />
    );
  }
);

BankAccountInput.displayName = 'BankAccountInput';

export { BankAccountInput };
