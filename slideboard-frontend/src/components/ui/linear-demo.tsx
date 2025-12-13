'use client';

import React from 'react';

import { MovingBorderCard } from './moving-border-card';
import { SpotlightCard } from './spotlight-card';

/**
 * Demo Component to showcase Linear Style
 */
export function LinearStyleDemo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-theme-bg-secondary rounded-xl">
      {/* Spotlight Effect Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-theme-text-primary">
          Spotlight Effect
        </h3>
        <SpotlightCard className="h-48 p-6 flex flex-col justify-center">
          <div className="h-10 w-10 rounded-full bg-theme-bg-tertiary flex items-center justify-center mb-4 border border-theme-border-light">
            <div className="h-3 w-3 rounded-full bg-primary-500" />
          </div>
          <h4 className="font-medium text-theme-text-primary">
            Invisible Container
          </h4>
          <p className="text-sm text-theme-text-secondary mt-2">
            Move your cursor here. The border and background are revealed by a
            spotlight.
          </p>
        </SpotlightCard>
      </div>

      {/* Moving Border Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-theme-text-primary">
          Moving Border
        </h3>
        <MovingBorderCard className="h-48 w-full">
          <div className="h-full w-full p-6 flex flex-col justify-center">
            <div className="h-10 w-10 rounded-full bg-theme-bg-tertiary flex items-center justify-center mb-4 border border-theme-border-light">
              <div className="h-3 w-3 rounded-full bg-primary-500" />
            </div>
            <h4 className="font-medium text-theme-text-primary">
              Active State
            </h4>
            <p className="text-sm text-theme-text-secondary mt-2">
              Perfect for highlighting active plans, features, or important
              alerts.
            </p>
          </div>
        </MovingBorderCard>
      </div>
    </div>
  );
}
