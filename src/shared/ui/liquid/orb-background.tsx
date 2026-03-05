'use client';

import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

export const OrbBackground = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn('fixed inset-0 -z-50 h-full w-full overflow-hidden bg-slate-950', className)}
    >
      {/* Orb 1: Purple/Blue */}
      <motion.div
        initial={{ x: -100, y: -100, opacity: 0 }}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
          opacity: 0.6,
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
        className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-purple-600/30 mix-blend-screen blur-[100px]"
      />

      {/* Orb 2: Cyan/Teal */}
      <motion.div
        initial={{ x: '100vw', y: 0, opacity: 0 }}
        animate={{
          x: ['80vw', '60vw', '80vw'],
          y: [0, 100, 0],
          scale: [1, 1.5, 1],
          opacity: 0.5,
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute top-[20%] right-0 h-[400px] w-[400px] rounded-full bg-cyan-500/20 mix-blend-screen blur-[90px]"
      />

      {/* Orb 3: Pink/Red */}
      <motion.div
        initial={{ x: '50vw', y: '100vh', opacity: 0 }}
        animate={{
          x: ['40vw', '60vw', '40vw'],
          y: ['80vh', '60vh', '80vh'],
          scale: [1, 1.3, 1],
          opacity: 0.4,
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
          delay: 5,
        }}
        className="absolute bottom-0 left-[20%] h-[600px] w-[600px] rounded-full bg-pink-600/20 mix-blend-screen blur-[120px]"
      />

      <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />
      {children}
    </div>
  );
};
