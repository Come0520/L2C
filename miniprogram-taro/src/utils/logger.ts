/**
 * 结构化日志工具
 *
 * @description 统一的日志记录接口，自动附带时间戳和用户上下文。
 * 开发环境输出到 console，生产环境可对接微信实时日志。
 */
import { useAuthStore } from '@/stores/auth'

/** 日志级别 */
type LogLevel = 'info' | 'warn' | 'error'

/** 日志条目 */
interface LogEntry {
    timestamp: string
    level: LogLevel
    module: string
    action: string
    userId?: string
    data?: Record<string, any>
    error?: string
}

/**
 * 格式化日志条目
 */
function createEntry(level: LogLevel, module: string, action: string, data?: Record<string, any>, error?: Error): LogEntry {
    const userInfo = useAuthStore.getState().userInfo
    return {
        timestamp: new Date().toISOString(),
        level,
        module,
        action,
        userId: userInfo?.id,
        data,
        error: error?.message,
    }
}

export const Logger = {
    /** 信息日志 */
    info(module: string, action: string, data?: Record<string, any>) {
        const entry = createEntry('info', module, action, data)
        console.log(`[${entry.module}] ${entry.action}`, entry)
    },

    /** 警告日志 */
    warn(module: string, action: string, data?: Record<string, any>) {
        const entry = createEntry('warn', module, action, data)
        console.warn(`[${entry.module}] ${entry.action}`, entry)
    },

    /** 错误日志 */
    error(module: string, action: string, error: Error, data?: Record<string, any>) {
        const entry = createEntry('error', module, action, data, error)
        console.error(`[${entry.module}] ${entry.action}`, entry)
    },
}
