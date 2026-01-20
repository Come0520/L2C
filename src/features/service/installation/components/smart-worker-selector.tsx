'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import User from 'lucide-react/dist/esm/icons/user';
import Check from 'lucide-react/dist/esm/icons/check';
import { cn } from '@/shared/utils';

interface Worker {
    id: string;
    name: string;
    workload: number;
}

interface SmartWorkerSelectorProps {
    value?: string;
    onSelect: (id: string) => void;
}

export function SmartWorkerSelector({ value, onSelect }: SmartWorkerSelectorProps) {
    const [workers] = useState<Worker[]>([
        { id: '1', name: 'Worker A', workload: 2 },
        { id: '2', name: 'Worker B', workload: 5 },
    ]);

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-medium">Select Worker</h4>
            <div className="grid grid-cols-1 gap-2">
                {workers.map((worker) => (
                    <div
                        key={worker.id}
                        className={cn(
                            "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                            value === worker.id ? "border-primary bg-primary/5" : "hover:bg-accent"
                        )}
                        onClick={() => onSelect(worker.id)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{worker.name}</p>
                                <p className="text-xs text-muted-foreground">Workload: {worker.workload} tasks</p>
                            </div>
                        </div>
                        {value === worker.id && <Check className="h-4 w-4 text-primary" />}
                    </div>
                ))}
            </div>
        </div>
    );
}
