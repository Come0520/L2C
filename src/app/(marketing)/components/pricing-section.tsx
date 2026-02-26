'use client';

import { useRef } from 'react';
import { useInView } from 'framer-motion';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { pricingPlans } from '@/constants/landing-data';
import { cn } from '@/shared/utils';

/**
 * 第 7 幕：定价方案 (Pricing)
 * 强调"永久免费"，shimmer 光泽扫过效果
 */
export function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="pricing" ref={ref} className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">多少钱？</h2>
          <p className="mt-4 text-xl text-gray-500">
            L2C 基础版{' '}
            <span className="relative inline-block font-bold text-blue-600">
              永久免费
              {/* Shimmer 效果 */}
              <span className="animate-shimmer pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </span>
          </p>
        </div>

        <div
          className={cn(
            'mx-auto grid max-w-4xl gap-8 transition-all duration-700 sm:grid-cols-2',
            isInView ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          )}
        >
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-2xl border p-8 shadow-sm transition-all',
                plan.highlighted
                  ? 'border-blue-200 bg-white shadow-lg ring-2 ring-blue-600'
                  : 'border-gray-200 bg-white'
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    <Sparkles size={12} />
                    推荐
                  </span>
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{plan.description}</p>

              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                {plan.period && <span className="ml-2 text-sm text-gray-500">{plan.period}</span>}
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3 text-sm">
                    <Check
                      size={16}
                      className={cn(
                        'mt-0.5 shrink-0',
                        feature.included ? 'text-blue-600' : 'text-gray-300'
                      )}
                    />
                    <span className={cn(feature.included ? 'text-gray-700' : 'text-gray-400')}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.cta.href}
                className={cn(
                  'mt-8 block rounded-xl py-3 text-center text-sm font-semibold transition-all',
                  plan.highlighted
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                )}
              >
                {plan.cta.text}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
