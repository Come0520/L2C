'use client';

import * as React from 'react';
import { PatternFormat, type PatternFormatProps } from 'react-number-format';
import { cn } from '@/shared/lib/utils';

export interface CreditCodeInputProps extends Omit<PatternFormatProps, 'customInput' | 'format'> {
  className?: string;
  onValidationChange?: (isValid: boolean) => void;
}

/**
 * 统一社会信用代码校验算法 (MOD 31-3)
 */
function validateUSCC(code: string): boolean {
  if (code.length !== 18) return false;
  const chars = '0123456789ABCDEFGHJKLMNPQRTUWXY';
  const weights = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28];

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const index = chars.indexOf(code[i]);
    if (index === -1) return false;
    sum += index * weights[i];
  }

  const checkCodeIndex = (31 - (sum % 31)) % 31;
  const checkCode = chars[checkCodeIndex];
  return code[17] === checkCode;
}

const CreditCodeInput = React.forwardRef<HTMLInputElement, CreditCodeInputProps>(
  ({ className, onValidationChange, onValueChange, ...props }, ref) => {
    const [isValid, setIsValid] = React.useState<boolean | null>(null);

    const handleValueChange: PatternFormatProps['onValueChange'] = (values, source) => {
      const { value } = values;
      if (value.length === 18) {
        const valid = validateUSCC(value);
        setIsValid(valid);
        onValidationChange?.(valid);
      } else {
        setIsValid(null);
        onValidationChange?.(false);
      }
      onValueChange?.(values, source);
    };

    return (
      <div className="relative w-full">
        <PatternFormat
          getInputRef={ref}
          format="##################"
          onValueChange={handleValueChange}
          className={cn(
            'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            isValid === false && 'border-destructive focus-visible:ring-destructive',
            isValid === true && 'border-green-500 focus-visible:ring-green-500',
            className
          )}
          {...props}
        />
        {isValid === false && (
          <p className="text-destructive mt-1 text-[10px]">信用代码校验失败，请检查输入</p>
        )}
      </div>
    );
  }
);

CreditCodeInput.displayName = 'CreditCodeInput';

export { CreditCodeInput };
