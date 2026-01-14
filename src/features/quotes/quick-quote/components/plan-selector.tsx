'use client';

import React from 'react';
import { cn } from '@/shared/utils';

export function PlanSelector({ selectedPlan, onSelect }: { selectedPlan?: string, onSelect: (id: string) => void }) {
    const plans = [
        { id: 'ECONOMIC', name: 'Economic', description: 'Basic plan' },
        { id: 'COMFORT', name: 'Comfort', description: 'Balanced plan' },
        { id: 'LUXURY', name: 'Luxury', description: 'High-end plan' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
                <div
                    key={plan.id}
                    className={cn(
                        "p-4 border rounded-xl cursor-pointer transition-all hover:border-primary/50",
                        selectedPlan === plan.id ? "border-primary bg-primary/5 shadow-md" : "border-border"
                    )}
                    onClick={() => onSelect(plan.id)}
                >
                    <h4 className="font-bold text-lg">{plan.name}</h4>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
            ))}
        </div>
    );
}
