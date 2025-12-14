'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2, AlertCircle, Download, RefreshCw, Filter, Clock } from 'lucide-react'
import React, { useState } from 'react'

import { cn } from '@/lib/utils'

import { PaperButton } from './paper-button'
import { PaperCard } from './paper-card'
import { PaperModal } from './paper-modal'
import { PaperSelect } from './paper-select'


interface FailedItem {
    id: string
    name?: string
    reason: string
    reasonCategory?: string
    metadata?: Record<string, unknown>
    errorCode?: string
}

interface OperationLog {
    timestamp: string
    message: string
    level: 'info' | 'warning' | 'error'
    details?: Record<string, unknown>
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
    onExportFailedItems?: (failedIds: string[]) => void
    operationId?: string
    startTime?: Date
    log?: OperationLog[]
    estimatedTimeRemaining?: number
    status?: 'running' | 'paused' | 'completed' | 'cancelled' | 'failed'
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
    onExportFailedItems,
    operationId,
    startTime,
    log = [],
    estimatedTimeRemaining,
    status = 'running',
}: BulkOperationProgressProps) {
    const [showLogs, setShowLogs] = useState(false)
    const [filterReason, setFilterReason] = useState<string>('all')
    const [showFailedDetails, setShowFailedDetails] = useState(true)

    const progress = total > 0 ? (current / total) * 100 : 0
    const isComplete = current >= total || status === 'completed' || status === 'cancelled' || status === 'failed'
    const hasErrors = failedCount > 0

    // 获取唯一的错误原因类别
    const reasonCategories = Array.from(new Set(failedItems.map(item => item.reasonCategory || 'unknown')))

    // 过滤失败项
    const filteredFailedItems = filterReason === 'all'
        ? failedItems
        : failedItems.filter(item => item.reasonCategory === filterReason)

    // 格式化剩余时间
    const formatTimeRemaining = (seconds: number) => {
        if (seconds < 60) return `${seconds}秒`
        if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟${seconds % 60}秒`
        return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`
    }

    // 计算运行时间
    const getRunningTime = () => {
        if (!startTime) return '0秒'
        const runningMs = Date.now() - startTime.getTime()
        const runningSeconds = Math.floor(runningMs / 1000)
        return formatTimeRemaining(runningSeconds)
    }

    return (
        <PaperModal isOpen={isOpen} onClose={onClose} title={title} className="max-w-2xl">
            <div className="space-y-6">
                {/* 操作信息 */}
                {operationId && (
                    <PaperCard padding="sm" className="status-card-info border">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary-500" />
                                <span className="text-primary-600 font-medium">操作ID: {operationId}</span>
                            </div>
                            <div className="flex items-center gap-2 text-primary-500">
                                <span>运行时间: {getRunningTime()}</span>
                                {estimatedTimeRemaining && (
                                    <span>• 剩余: {formatTimeRemaining(estimatedTimeRemaining)}</span>
                                )}
                            </div>
                        </div>
                    </PaperCard>
                )}

                {/* 进度条 */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-medium text-theme-text-primary">
                        <div className="flex items-center gap-2">
                            <span>进度</span>
                            {status !== 'running' && (
                                <span className={
                                    status === 'paused' ? 'status-badge-paused' :
                                        status === 'completed' ? 'status-badge-completed' :
                                            status === 'cancelled' ? 'status-badge-cancelled' :
                                                'status-badge-failed'
                                }>
                                    {status === 'paused' ? '已暂停' :
                                        status === 'completed' ? '已完成' :
                                            status === 'cancelled' ? '已取消' :
                                                '失败'}
                                </span>
                            )}
                        </div>
                        <span>{current} / {total}</span>
                    </div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full progress-bar-bg">
                        <motion.div
                            className="h-full progress-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                        {/* 光泽效果 */}
                        {!isComplete && status === 'running' && (
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
                            className="text-2xl font-bold text-primary-600"
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
                            className="text-2xl font-bold text-success-600"
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
                            className="text-2xl font-bold text-error-600"
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
                    {hasErrors && showFailedDetails && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-2"
                        >
                            <div className="flex items-center justify-between text-sm font-medium text-error-600">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>失败详情 ({failedCount})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {reasonCategories.length > 1 && (
                                        <PaperSelect
                                            options={[
                                                { value: 'all', label: '全部原因' },
                                                ...reasonCategories.map(category => ({
                                                    value: category,
                                                    label: category === 'unknown' ? '未知原因' : category
                                                }))
                                            ]}
                                            value={filterReason}
                                            onChange={(value) => setFilterReason(value)}
                                            className="w-40"
                                        >
                                            <div className="flex items-center gap-1">
                                                <Filter className="h-4 w-4" />
                                                <span>筛选</span>
                                            </div>
                                        </PaperSelect>
                                    )}
                                    <button
                                        onClick={() => setShowFailedDetails(false)}
                                        className="text-xs text-error-500 hover:text-error-700"
                                    >
                                        收起
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2 p-3 failed-items-container rounded-lg border">
                                {filteredFailedItems.length > 0 ? (
                                    filteredFailedItems.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="p-3 bg-theme-bg-secondary rounded shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start gap-2">
                                                <XCircle className="mt-0.5 h-4 w-4 text-error-500 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    {item.name && (
                                                        <div className="font-medium text-sm truncate text-theme-text-primary">
                                                            {item.name}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-theme-text-secondary mt-1">
                                                        {item.reason}
                                                    </div>
                                                    {item.errorCode && (
                                                        <div className="mt-1 flex items-center gap-1">
                                                            <span className="px-1.5 py-0.5 bg-ink-100 text-ink-600 rounded text-xs font-mono">
                                                                {item.errorCode}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {item.reasonCategory && item.reasonCategory !== 'unknown' && (
                                                        <div className="mt-1 flex items-center gap-1">
                                                            <span className="px-1.5 py-0.5 bg-ink-100 text-ink-600 rounded text-xs">
                                                                {item.reasonCategory}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-theme-text-secondary">
                                        没有匹配的失败项
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 显示/隐藏失败详情按钮 */}
                {hasErrors && !showFailedDetails && (
                    <div className="flex justify-center">
                        <PaperButton
                            variant="outline"
                            onClick={() => setShowFailedDetails(true)}
                            size="sm"
                        >
                            显示失败详情 ({failedCount})
                        </PaperButton>
                    </div>
                )}

                {/* 操作日志 */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium text-theme-text-primary">
                        <button
                            onClick={() => setShowLogs(!showLogs)}
                            className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                        >
                            <span>操作日志 ({log.length})</span>
                            <motion.svg
                                className="h-4 w-4 transition-transform"
                                initial={{ rotate: 0 }}
                                animate={{ rotate: showLogs ? 180 : 0 }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </motion.svg>
                        </button>
                    </div>

                    <AnimatePresence>
                        {showLogs && log.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="max-h-40 overflow-y-auto p-3 log-container rounded-lg border text-sm">
                                    {log.map((entry, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="mb-2 pb-2 border-b border-[var(--theme-border-light)] last:border-0 last:mb-0 last:pb-0"
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className="text-[var(--theme-text-secondary)] text-xs mt-0.5 flex-shrink-0">
                                                    {new Date(entry.timestamp).toLocaleTimeString()}
                                                </span>
                                                <div className="flex-1">
                                                    <div className={`font-medium ${entry.level === 'error' ? 'text-error-600' :
                                                        entry.level === 'warning' ? 'text-warning-600' :
                                                            'text-primary-600'
                                                        }`}>
                                                        {entry.message}
                                                    </div>
                                                    {entry.details && Object.keys(entry.details).length > 0 && (
                                                        <div className="mt-1 text-xs text-ink-500 font-mono bg-ink-100 p-2 rounded overflow-x-auto">
                                                            {JSON.stringify(entry.details, null, 2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                    {!isComplete && status === 'running' && onCancel && (
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
                            leftIcon={<RefreshCw className="h-4 w-4" />}
                        >
                            重试失败项
                        </PaperButton>
                    )}

                    {isComplete && hasErrors && onExportFailedItems && (
                        <PaperButton
                            variant="outline"
                            onClick={() => onExportFailedItems(failedItems.map(i => i.id))}
                            className="flex-1"
                            leftIcon={<Download className="h-4 w-4" />}
                        >
                            导出失败项
                        </PaperButton>
                    )}

                    <PaperButton
                        onClick={onClose}
                        className="flex-1"
                        variant={isComplete && !hasErrors ? "primary" : "outline"}
                    >
                        {isComplete && !hasErrors ? '完成' : '关闭'}
                    </PaperButton>
                </div>

                {/* 完成动画 */}
                <AnimatePresence>
                    {isComplete && !hasErrors && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-[var(--theme-bg-primary)]/80 backdrop-blur-sm rounded-xl"
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-center"
                            >
                                <CheckCircle2 className="mx-auto h-16 w-16 text-success-500" />
                                <p className="mt-4 text-lg font-semibold text-theme-text-primary">全部完成！</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PaperModal>
    )
}
