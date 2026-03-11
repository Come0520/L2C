'use client';

import * as React from 'react';
import { Input } from '@/shared/ui/input';
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
      // 当为空字符串、或者为非法数字时，放弃计算并返回 null
      if (!width || !height || isNaN(Number(width)) || isNaN(Number(height))) {
        return null;
      }
      const w = Number(width);
      const h = Number(height);
      return (w * h).toFixed(2);
    }, [width, height]);

    return (
      <div ref={ref} className={cn('flex flex-col gap-1.5', className)} {...props}>
        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <Input
              type="text"
              inputMode="decimal"
              aria-label="宽度"
              value={width}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onWidthChange?.(e.target.value)}
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
              type="text"
              inputMode="decimal"
              aria-label="高度"
              value={height}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onHeightChange?.(e.target.value)
              }
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
        {showArea && area !== null && (
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
