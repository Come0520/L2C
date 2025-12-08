'use client';

import { motion } from 'framer-motion';
import React, { useState, useRef } from 'react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

/**
 * Linear Style Spotlight Card
 * 具有鼠标跟随聚光灯效果的卡片
 */
export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(59, 130, 246, 0.15)', // 默认蓝色微光
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setOpacity(1);
  };

  const handleBlur = () => {
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

/**
 * Linear Style Moving Border Card
 * 具有流光边框效果的卡片
 */
export function MovingBorderCard({
  children,
  className = '',
  duration = 4000,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-neutral-950 p-[1px] ${className}`}>
      {/* 旋转的流光层 */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: duration / 1000, repeat: Infinity, ease: 'linear' }}
        className="absolute -inset-[300%] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#3b82f6_100%)] opacity-100"
      />
      
      {/* 内容遮罩层 */}
      <div className="relative flex h-full w-full flex-col rounded-xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-3xl">
        {children}
      </div>
    </div>
  );
}

/**
 * Demo Component to showcase Linear Style
 */
export function LinearStyleDemo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
      {/* Spotlight Effect Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Spotlight Effect</h3>
        <SpotlightCard className="h-48 p-6 flex flex-col justify-center">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
          </div>
          <h4 className="font-medium text-neutral-900 dark:text-white">Invisible Container</h4>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            Move your cursor here. The border and background are revealed by a spotlight.
          </p>
        </SpotlightCard>
      </div>

      {/* Moving Border Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Moving Border</h3>
        <MovingBorderCard className="h-48 w-full">
          <div className="h-full w-full p-6 flex flex-col justify-center">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
              <div className="h-3 w-3 rounded-full bg-purple-500" />
            </div>
            <h4 className="font-medium text-neutral-900 dark:text-white">Active State</h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
              Perfect for highlighting active plans, features, or important alerts.
            </p>
          </div>
        </MovingBorderCard>
      </div>
    </div>
  );
}
