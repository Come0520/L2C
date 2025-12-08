// 日志记录客户端服务

import { createClient } from '@/lib/supabase/client'
import { LogEntry, LogQueryParams, LogQueryResult, LogAction, LogLevel } from '@/types/logs'

/**
 * 日志记录客户端服务类
 */
export class LogsClient {
  /**
   * 创建日志记录
   * @param log 日志数据
   * @returns 创建的日志记录
   */
  async createLog(log: Omit<LogEntry, 'id' | 'createdAt'>): Promise<LogEntry> {
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(log)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`创建日志失败: ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('日志创建失败:', error);
      throw error;
    }
  }

  /**
   * 获取日志列表
   * @param params 查询参数
   * @returns 日志列表和分页信息
   */
  async getLogs(params: LogQueryParams = {}): Promise<LogQueryResult> {
    const supabase = createClient()
    let query = supabase
      .from('logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 应用筛选条件
    if (params.userId) {
      query = query.eq('user_id', params.userId);
    }

    if (params.action) {
      query = query.eq('action', params.action);
    }

    if (params.level) {
      query = query.eq('level', params.level);
    }

    if (params.resourceId) {
      query = query.eq('resource_id', params.resourceId);
    }

    if (params.resourceType) {
      query = query.eq('resource_type', params.resourceType);
    }

    if (params.startDate) {
      query = query.gte('created_at', params.startDate);
    }

    if (params.endDate) {
      query = query.lte('created_at', params.endDate);
    }

    // 分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const offset = (page - 1) * pageSize;

    query = query.range(offset, offset + pageSize - 1);

    const { data, count } = await query;

    if (count === null) {
      throw new Error('Failed to get log count');
    }

    // Convert snake_case to camelCase for client-side consumption
    const formattedLogs = (data || []).map(log => ({
      id: log.id,
      userId: log.user_id,
      userName: log.user_name,
      action: log.action,
      level: log.level,
      resourceId: log.resource_id,
      resourceType: log.resource_type,
      details: log.details,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at
    }));

    const total = count;
    const totalPages = Math.ceil(total / pageSize);

    return {
      logs: formattedLogs as LogEntry[],
      total,
      page,
      pageSize,
      totalPages
    };
  }

  /**
   * 获取单个日志记录
   * @param id 日志ID
   * @returns 日志记录
   */
  async getLogById(id: string): Promise<LogEntry | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`获取日志失败: ${error.message}`);
    }

    // Convert snake_case to camelCase for client-side consumption
    if (data) {
      return {
        id: data.id,
        userId: data.user_id,
        userName: data.user_name,
        action: data.action,
        level: data.level,
        resourceId: data.resource_id,
        resourceType: data.resource_type,
        details: data.details,
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
        createdAt: data.created_at
      } as LogEntry;
    }

    return null;
  }

  /**
   * 删除日志记录
   * @param id 日志ID
   * @returns 删除结果
   */
  async deleteLog(id: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
      .from('logs')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除日志失败: ${error.message}`);
    }

    return true;
  }

  /**
   * 清理旧日志
   * @param days 保留天数
   * @returns 清理结果
   */
  async cleanupOldLogs(days: number): Promise<number> {
    const supabase = createClient()
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { count, error: countError } = await supabase
      .from('logs')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', cutoffDate.toISOString())

    if (countError) {
      throw new Error(`统计日志失败: ${countError.message}`)
    }

    const { error: deleteError } = await supabase
      .from('logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (deleteError) {
      throw new Error(`清理日志失败: ${deleteError.message}`)
    }

    return count || 0
  }


}

// 导出单例
export const logsService = new LogsClient()

/**
 * 记录测量单相关操作日志的便捷函数
 */
export const logMeasurementOperation = async (
  userId: string,
  userName: string,
  action: LogAction,
  level: LogLevel,
  measurementId: string,
  details?: Record<string, unknown>
) => {
  try {
    await logsService.createLog({
      userId,
      userName,
      action,
      level,
      resourceId: measurementId,
      resourceType: 'measurement',
      details
    });
  } catch (_) {
  }
};
