import { createClient } from '@/lib/supabase/client';
import type { Warning, WarningStats } from '@/types/warnings';

/**
 * 获取未解决的预警列表
 */
export async function fetchWarnings(params?: {
    resolved?: boolean;
    severity?: string;
    type?: string;
}): Promise<Warning[]> {
    const supabase = createClient();
    const db = supabase as any;

    let query = db
        .from('warnings')
        .select('*')
        .order('created_at', { ascending: false });

    if (params?.resolved !== undefined) {
        if (params.resolved) {
            query = query.not('resolved_at', 'is', null);
        } else {
            query = query.is('resolved_at', null);
        }
    }

    if (params?.severity) {
        query = query.eq('severity', params.severity);
    }

    if (params?.type) {
        query = query.eq('type', params.type);
    }

    // @ts-ignore - 由于类型定义缺失，暂时忽略类型检查
    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as unknown as Warning[];
}

/**
 * 获取预警统计
 */
export async function fetchWarningStats(): Promise<WarningStats[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .rpc('get_warning_stats');

    if (error) throw error;
    return (data || []) as unknown as WarningStats[];
}

/**
 * 标记预警已解决
 */
export async function resolveWarning(warningId: number): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .rpc('resolve_warning', { warning_id: warningId });

    if (error) throw error;
}

/**
 * 批量标记预警已解决
 */
export async function resolveWarnings(warningIds: number[]): Promise<void> {
    const supabase = createClient();

    // 注意：这里我们使用普通的 update，因为 resolve_warning 只是单个处理
    // 实际生产中最好也为此创建一个 RPC 或循环调用
    const { error } = await supabase
        .from('warnings')
        .update({
            resolved_at: new Date().toISOString(),
            // resolved_by 会由 RLS 或触发器处理，但在 update 中最好也尝试写入（尽管 RLS 可能会限制）
            // 如果使用了我们的 update policy，这里应该可以工作
        })
        .in('id', warningIds);

    if (error) throw error;
}

/**
 * 手动触发预警检测
 */
export async function triggerWarningDetection(): Promise<{
    success: boolean;
    warnings_created: number;
}> {
    const supabase = createClient();

    const { data, error } = await supabase.functions.invoke('lead-warnings-detector');

    if (error) throw error;
    return data;
}
