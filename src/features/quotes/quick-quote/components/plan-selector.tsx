'use client';

import React from 'react';
import { cn } from '@/shared/utils';

export function PlanSelector({
  selectedPlan,
  onSelect,
}: {
  selectedPlan?: string;
  onSelect: (id: string) => void;
}) {
  const plans = [
    { id: 'ECONOMIC', name: 'Economic', description: 'Basic plan' },
    { id: 'COMFORT', name: 'Comfort', description: 'Balanced plan' },
    { id: 'LUXURY', name: 'Luxury', description: 'High-end plan' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            'hover:border-primary/50 cursor-pointer rounded-xl border p-4 transition-all',
            selectedPlan === plan.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border'
          )}
          onClick={() => onSelect(plan.id)}
        >
          <h4 className="text-lg font-bold">{plan.name}</h4>
          <p className="text-muted-foreground text-sm">{plan.description}</p>
        </div>
      ))}
    </div>
  );
}
