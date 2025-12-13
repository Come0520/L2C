'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import React from 'react'

import { PaperModal } from './paper-modal'
import { PaperButton } from './paper-button'
import { PaperCard } from './paper-card'
import { cn } from '@/lib/utils'

interface FailedItem {
    id: string
    name?: string
    reason: string
}

interface BulkOperationProgressProps {
    isOpen: boolean
    onClose: () => void
    title: string
    total: number
    current: number
    successCount: number
    failedCount: number
    failedItems?: FailedItem[]
    onCancel?: () => void
    onRetry?: (failedIds: string[]) => void
}

export function BulkOperationProgress({
    isOpen,
    onClose,
    title,
    total,
    current,
    successCount,
    failedCount,
    failedItems = [],
    onCancel,
    onRetry,
}: BulkOperationProgressProps) {
    const progress = total > 0 ? (current / total) * 100 : 0
    const isComplete = current >= total
    const hasErrors = failedCount > 0

    return (
        <PaperModal isOpen={isOpen} onClose={onClose} title={title} className="max-w-2xl">
            <div className="space-y-6">
                {/* 进度条 */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-theme-text-primary">
                        <span>进度</span>
                        <span>{current} / {total}</span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-paper-200">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                        {/* 光泽效果 */}
                        {!isComplete && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                style={{ width: '50%' }}
                            />
                        )}
                    </div>
                </div>

                {/* 统计卡片 */}
                <div className="grid grid-cols-3 gap-4">
                    <PaperCard padding="sm" className="text-center">
                        <motion.div
                            className="text-2xl font-bold text-blue-600"
                            key={current}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {current}
                        </motion.div>
                        <div className="text-xs text-theme-text-secondary mt-1">已处理</div>
                    </PaperCard>

                    <PaperCard padding="sm" className="text-center">
                        <motion.div
                            className="text-2xl font-bold text-green-600"
                            key={successCount}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {successCount}
                        </motion.div>
                        <div className="text-xs text-theme-text-secondary mt-1">成功</div>
                    </PaperCard>

                    <PaperCard padding="sm" className="text-center">
                        <motion.div
                            className="text-2xl font-bold text-red-600"
                            key={failedCount}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {failedCount}
                        </motion.div>
                        <div className="text-xs text-theme-text-secondary mt-1">失败</div>
                    </PaperCard>
                </div>

                {/* 失败列表 */}
                <AnimatePresence>
                    {hasErrors && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-2"
                        >
                            <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>失败详情 ({failedCount})</span>
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-red-50 rounded-lg border border-red-200">
                                {failedItems.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-3 bg-white rounded shadow-sm"
                                    >
                                        <div className="flex items-start gap-2">
                                            <XCircle className="mt-0.5 h-4 w-4 text-red-500 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                {item.name && (
                                                    <div className="font-medium text-sm truncate text-theme-text-primary">
                                                        {item.name}
                                                    </div>
                                                )}
                                                <div className="text-xs text-theme-text-secondary mt-1">
                                                    {item.reason}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                    {!isComplete && onCancel && (
                        <PaperButton
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1"
                        >
                            取消操作
                        </PaperButton>
                    )}

                    {isComplete && hasErrors && onRetry && (
                        <PaperButton
                            variant="outline"
                            onClick={() => onRetry(failedItems.map(i => i.id))}
                            className="flex-1"
                        >
                            重试失败项
                        </PaperButton>
                    )}

                    {isComplete && (
                        <PaperButton
                            onClick={onClose}
                            className="flex-1"
                            variant={hasErrors ? "outline" : "primary"}
                        >
                            {hasErrors ? '关闭' : '完成'}
                        </PaperButton>
                    )}
                </div>

                {/* 完成动画 */}
                <AnimatePresence>
                    {isComplete && !hasErrors && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl"
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-center"
                            >
                                <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
                                <p className="mt-4 text-lg font-semibold text-theme-text-primary">全部完成！</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PaperModal>
    )
}
