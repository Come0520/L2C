'use client';

import * as React from 'react';
import { NumericFormat, type NumericFormatProps } from 'react-number-format';
import { cn } from '@/shared/lib/utils';

export interface CurrencyInputProps extends Omit<NumericFormatProps, 'customInput'> {
  className?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <NumericFormat
        getInputRef={ref}
        thousandSeparator=","
        decimalScale={2}
        fixedDecimalScale
        prefix="¥ "
        allowNegative={false}
        className={cn(
          'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
