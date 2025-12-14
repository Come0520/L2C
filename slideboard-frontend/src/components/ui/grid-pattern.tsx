'use client';

import { cn } from '@/lib/utils';

interface GridPatternProps {
    className?: string;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    squares?: Array<[number, number]>;
    strokeDasharray?: string;
}

/**
 * GridPattern 组件 - 为 File Upload 提供背景网格装饰
 * 
 * @description
 * 创建一个点状网格背景，使用主题变量自动适配三种主题
 */
export function GridPattern({
    className,
    width = 20,
    height = 20,
    x = 0,
    y = 0,
    squares,
    strokeDasharray = '0',
    ...props
}: GridPatternProps & React.SVGProps<SVGSVGElement>) {
    const patternId = `grid-pattern-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg
            aria-hidden="true"
            className={cn(
                'pointer-events-none absolute inset-0 h-full w-full',
                className
            )}
            {...props}
        >
            <defs>
                <pattern
                    id={patternId}
                    width={width}
                    height={height}
                    patternUnits="userSpaceOnUse"
                    x={x}
                    y={y}
                >
                    <circle
                        cx={1}
                        cy={1}
                        r={1}
                        className="fill-theme-text-secondary/20"
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
            {squares && (
                <svg x={x} y={y} className="overflow-visible">
                    {squares.map(([x, y], index) => (
                        <rect
                            strokeWidth="0"
                            key={`${x}-${y}-${index}`}
                            width={width - 1}
                            height={height - 1}
                            x={x * width + 1}
                            y={y * height + 1}
                            className="fill-theme-text-secondary/40"
                        />
                    ))}
                </svg>
            )}
        </svg>
    );
}
