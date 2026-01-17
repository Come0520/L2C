
'use client';

import { Button } from '@/shared/ui/button';
import Delete from 'lucide-react/dist/esm/icons/delete';
import Check from 'lucide-react/dist/esm/icons/check';

interface NumericKeypadProps {
    onValueChange: (val: number) => void;
    onNext?: () => void;
    value: number;
}

export function NumericKeypad({ onValueChange, onNext, value }: NumericKeypadProps) {
    const handleNum = (num: number) => {
        const newVal = Number(`${value || ''}${num}`);
        onValueChange(newVal);
    };

    const handleDelete = () => {
        const str = String(value);
        if (str.length <= 1) onValueChange(0);
        else onValueChange(Number(str.slice(0, -1)));
    };

    return (
        <div className="grid grid-cols-4 gap-2 p-2 bg-white dark:bg-zinc-900 border-t fixed bottom-0 left-0 right-0 z-50 pb-6">
            {[1, 2, 3].map(n => (
                <Button key={n} variant="outline" className="h-14 text-xl" onClick={() => handleNum(n)}>{n}</Button>
            ))}
            <Button variant="ghost" className="h-14" onClick={handleDelete}><Delete /></Button>

            {[4, 5, 6].map(n => (
                <Button key={n} variant="outline" className="h-14 text-xl" onClick={() => handleNum(n)}>{n}</Button>
            ))}
            <Button variant="primary" className="h-28 text-xl row-span-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onNext?.()}>
                <Check />
            </Button>

            {[7, 8, 9].map(n => (
                <Button key={n} variant="outline" className="h-14 text-xl" onClick={() => handleNum(n)}>{n}</Button>
            ))}

            <Button variant="outline" className="h-14 text-xl col-span-2" onClick={() => handleNum(0)}>0</Button>
            <Button variant="outline" className="h-14 text-xl">.</Button>
        </div>
    );
}
