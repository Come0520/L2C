import { logsService } from '@/services/logs.client'
import { LogLevel, LogAction } from '@/types/logs'

type LoggerContext = {
  userId?: string
  userName?: string
  resourceType?: string
  resourceId?: string
  action?: LogAction
  details?: Record<string, unknown>
}

// 日志缓冲配置
const LOG_BUFFER_SIZE = 10; // 缓冲队列大小
const LOG_FLUSH_INTERVAL = 5000; // 自动刷新间隔（毫秒）

// 日志缓冲队列
let logBuffer: Array<{
  level: LogLevel
  message: string
  ctx: LoggerContext
}> = [];

// 定时器引用
let flushTimer: NodeJS.Timeout | null = null;

// 标记是否正在刷新日志
let isFlushing = false;

/**
 * 写入日志到缓冲队列
 */
function write(level: LogLevel, message: string, ctx: LoggerContext = {}) {
  // 添加到缓冲队列
  logBuffer.push({ level, message, ctx });
  
  // 启动定时器（如果尚未启动）
  if (!flushTimer) {
    flushTimer = setTimeout(flushLogs, LOG_FLUSH_INTERVAL);
  }
  
  // 如果缓冲队列达到阈值，立即刷新
  if (logBuffer.length >= LOG_BUFFER_SIZE) {
    flushLogs();
  }
}

/**
 * 发送单个日志
 */
async function sendLog(logItem: {
  level: LogLevel
  message: string
  ctx: LoggerContext
}) {
  // 使用上下文提供的action，默认使用'view_measurement'
  const action: LogAction = logItem.ctx.action || 'view_measurement'
  try {
    await logsService.createLog({
      userId: logItem.ctx.userId || 'system',
      userName: logItem.ctx.userName || 'system',
      action,
      level: logItem.level,
      resourceId: logItem.ctx.resourceId,
      resourceType: logItem.ctx.resourceType,
      details: { message: logItem.message, ...(logItem.ctx.details || {}) }
    })
  } catch (error) {
    // 改进错误处理，记录到控制台但不抛出，避免影响主流程
    console.error('日志写入失败:', error)
    throw error; // 重新抛出以便上层处理
  }
}

// 离线缓存键名
const OFFLINE_LOGS_KEY = 'slideboard_offline_logs';

/**
 * 保存日志到本地缓存
 * @param logs 要保存的日志数组
 */
function saveLogsToLocalStorage(logs: typeof logBuffer) {
  if (typeof window === 'undefined') return;
  
  try {
    const existingLogs = getLogsFromLocalStorage();
    const allLogs = [...existingLogs, ...logs];
    // 限制缓存日志数量，避免占用过多存储空间
    const limitedLogs = allLogs.slice(-100); // 只保留最近100条日志
    localStorage.setItem(OFFLINE_LOGS_KEY, JSON.stringify(limitedLogs));
  } catch (error) {
    console.error('保存日志到本地缓存失败:', error);
  }
}

/**
 * 从本地缓存获取日志
 * @returns 缓存的日志数组
 */
function getLogsFromLocalStorage(): typeof logBuffer {
  if (typeof window === 'undefined') return [];
  
  try {
    const logs = localStorage.getItem(OFFLINE_LOGS_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('从本地缓存获取日志失败:', error);
    return [];
  }
}

/**
 * 清除本地缓存的日志
 */
function clearLogsFromLocalStorage() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(OFFLINE_LOGS_KEY);
  } catch (error) {
    console.error('清除本地缓存日志失败:', error);
  }
}

/**
 * 尝试发送本地缓存的日志
 */
async function trySendCachedLogs() {
  const cachedLogs = getLogsFromLocalStorage();
  if (cachedLogs.length === 0) return;
  
  try {
    // 批量发送缓存的日志
    for (const logItem of cachedLogs) {
      await sendLog(logItem);
    }
    
    // 发送成功，清除缓存
    clearLogsFromLocalStorage();
  } catch (error) {
    console.error('发送缓存日志失败:', error);
    // 发送失败，保留缓存
  }
}

// 确保在页面卸载时刷新日志
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushLogs);
  
  // 页面加载时尝试发送缓存的日志
  window.addEventListener('load', trySendCachedLogs);
  
  // 网络恢复时尝试发送缓存的日志
  window.addEventListener('online', trySendCachedLogs);
}

/**
 * 刷新日志缓冲，批量发送日志
 */
async function flushLogs() {
  // 避免并发刷新
  if (isFlushing || logBuffer.length === 0) {
    return;
  }
  
  isFlushing = true;
  
  // 取出当前缓冲队列的所有日志
  const logsToSend = [...logBuffer];
  logBuffer = [];
  
  try {
    // 批量发送日志
    for (const logItem of logsToSend) {
      await sendLog(logItem);
    }
  } catch (error) {
    console.error('批量日志发送失败:', error);
    // 将未发送的日志保存到本地缓存
    saveLogsToLocalStorage(logsToSend);
    // 不重新加入内存缓冲，避免重复尝试发送
  } finally {
    isFlushing = false;
  }
  
  // 清除定时器
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

export const logger = {
  info: (message: string, ctx?: LoggerContext) => write('info', message, ctx),
  warning: (message: string, ctx?: LoggerContext) => write('warning', message, ctx),
  error: (message: string, ctx?: LoggerContext) => write('error', message, ctx),
  debug: (message: string, ctx?: LoggerContext) => write('debug', message, ctx),
  // 暴露手动刷新方法，便于测试和特殊场景使用
  flush: flushLogs,
  // 暴露手动发送缓存日志方法
  sendCachedLogs: trySendCachedLogs
}
