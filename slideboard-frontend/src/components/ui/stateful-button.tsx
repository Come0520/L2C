'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { PaperButton } from './paper-button';

export type ButtonStatus = 'idle' | 'loading' | 'success' | 'error';

interface StatefulButtonProps extends React.ComponentProps<typeof PaperButton> {
  status?: ButtonStatus;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  duration?: number; // 状态持续时间，默认 2000ms
}

export function StatefulButton({
  children,
  status = 'idle',
  loadingText = 'Loading...',
  successText = 'Success',
  errorText = 'Error',
  duration = 2000,
  onClick,
  disabled,
  className,
  ...props
}: StatefulButtonProps) {
  // 内部状态，用于在 success/error 后自动恢复 idle
  const [internalStatus, setInternalStatus] = useState<ButtonStatus>(status);

  // 同步外部 status 到 internalStatus
  useEffect(() => {
    setInternalStatus(status);
  }, [status]);

  // 自动恢复逻辑
  useEffect(() => {
    if (internalStatus === 'success' || internalStatus === 'error') {
      const timer = setTimeout(() => {
        setInternalStatus('idle');
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [internalStatus, duration]);

  const isLoading = internalStatus === 'loading';
  const isSuccess = internalStatus === 'success';
  const isError = internalStatus === 'error';

  // 根据状态动态调整 variant
  const getVariant = () => {
    if (isSuccess) return 'success';
    if (isError) return 'error';
    return props.variant || 'primary';
  };

  return (
    <PaperButton
      className={className}
      disabled={disabled || isLoading}
      variant={getVariant()}
      onClick={onClick}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{loadingText}</span>
          </motion.div>
        )}

        {isSuccess && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>{successText}</span>
          </motion.div>
        )}

        {isError && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            <span>{errorText}</span>
          </motion.div>
        )}

        {internalStatus === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </PaperButton>
  );
}
