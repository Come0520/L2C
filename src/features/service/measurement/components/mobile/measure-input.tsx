'use client';

import { useCallback, useMemo } from 'react';
import { Button } from '@/shared/ui/button';
import Delete from 'lucide-react/dist/esm/icons/delete';
import Check from 'lucide-react/dist/esm/icons/check';

interface NumericKeypadProps {
    onValueChange: (val: number) => void;
    onNext?: () => void;
    value: number;
}

export function NumericKeypad({ onValueChange, onNext, value }: NumericKeypadProps) {
    // 使用 useCallback 稳定引用，避免子组件重渲染
    const handleNum = useCallback((num: number) => {
        const newVal = Number(`${value || ''}${num}`);
        onValueChange(newVal);
    }, [onValueChange, value]);

    const handleDelete = useCallback(() => {
        const str = String(value);
        if (str.length <= 1) onValueChange(0);
        else onValueChange(Number(str.slice(0, -1)));
    }, [onValueChange, value]);

    const handleNext = useCallback(() => onNext?.(), [onNext]);
    const handleZero = useCallback(() => handleNum(0), [handleNum]);

    // 预生成数字按钮点击处理器，避免在 map 中创建
    const numHandlers = useMemo(() => ({
        1: () => handleNum(1),
        2: () => handleNum(2),
        3: () => handleNum(3),
        4: () => handleNum(4),
        5: () => handleNum(5),
        6: () => handleNum(6),
        7: () => handleNum(7),
        8: () => handleNum(8),
        9: () => handleNum(9),
    }), [handleNum]);

    return (
        <div className="grid grid-cols-4 gap-2 p-2 bg-background border-t border-border fixed bottom-0 left-0 right-0 z-50 pb-6 glass-panel">
            {[1, 2, 3].map(n => (
                <Button key={n} variant="outline" className="h-14 text-xl" onClick={numHandlers[n as keyof typeof numHandlers]}>{n}</Button>
            ))}
            <Button variant="ghost" className="h-14" onClick={handleDelete}><Delete /></Button>

            {[4, 5, 6].map(n => (
                <Button key={n} variant="outline" className="h-14 text-xl" onClick={numHandlers[n as keyof typeof numHandlers]}>{n}</Button>
            ))}
            <Button variant="primary" className="h-28 text-xl row-span-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleNext}>
                <Check />
            </Button>

            {[7, 8, 9].map(n => (
                <Button key={n} variant="outline" className="h-14 text-xl" onClick={numHandlers[n as keyof typeof numHandlers]}>{n}</Button>
            ))}

            <Button variant="outline" className="h-14 text-xl col-span-2" onClick={handleZero}>0</Button>
            <Button variant="outline" className="h-14 text-xl">.</Button>
        </div>
    );
}
