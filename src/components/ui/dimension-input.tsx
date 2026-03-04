'use client';

import * as React from 'react';
import { Input } from './input';
import { cn } from '@/shared/lib/utils';

export interface DimensionInputProps {
  width?: number | string;
  height?: number | string;
  onWidthChange?: (value: string) => void;
  onHeightChange?: (value: string) => void;
  showArea?: boolean;
  unit?: string;
  className?: string;
  disabled?: boolean;
}

const DimensionInput = React.forwardRef<HTMLDivElement, DimensionInputProps>(
  (
    {
      width,
      height,
      onWidthChange,
      onHeightChange,
      showArea = false,
      unit = 'm',
      className,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const area = React.useMemo(() => {
      const w = Number(width) || 0;
      const h = Number(height) || 0;
      return (w * h).toFixed(2);
    }, [width, height]);

    return (
      <div ref={ref} className={cn('flex flex-col gap-1.5', className)} {...props}>
        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <Input
              type="number"
              value={width}
              onChange={(e) => onWidthChange?.(e.target.value)}
              placeholder="宽"
              className="pr-6 text-right"
              disabled={disabled}
            />
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] uppercase">
              W
            </span>
          </div>
          <span className="text-muted-foreground shrink-0 text-xs">×</span>
          <div className="relative flex-1">
            <Input
              type="number"
              value={height}
              onChange={(e) => onHeightChange?.(e.target.value)}
              placeholder="高"
              className="pr-6 text-right"
              disabled={disabled}
            />
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] uppercase">
              H
            </span>
          </div>
          <span className="text-muted-foreground text-xs select-none">{unit}</span>
        </div>
        {showArea && (
          <div className="text-muted-foreground pl-1 text-[10px]">
            面积: <span className="font-medium">{area}</span> {unit}²
          </div>
        )}
      </div>
    );
  }
);

DimensionInput.displayName = 'DimensionInput';

export { DimensionInput };
