import { createClient } from '@/lib/supabase/client';

export interface Warning {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    lead_id?: string;
    order_id?: string;
    message: string;
    action_required: string;
    metadata?: Record<string, any>;
    created_at: string;
    resolved_at?: string;
    resolved_by?: string;
}

export interface WarningStats {
    type: string;
    count: number;
    severity: string;
}

/**
 * 获取未解决的预警列表
 */
export async function fetchWarnings(params?: {
    resolved?: boolean;
    severity?: string;
    type?: string;
}): Promise<Warning[]> {
    const supabase = createClient();

    let query = supabase
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

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
}

/**
 * 获取预警统计
 */
export async function fetchWarningStats(): Promise<WarningStats[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .rpc('get_warning_stats');

    if (error) throw error;
    return data || [];
}

/**
 * 标记预警已解决
 */
export async function resolveWarning(warningId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .rpc('resolve_warning', { warning_id: warningId });

    if (error) throw error;
}

/**
 * 批量标记预警已解决
 */
export async function resolveWarnings(warningIds: string[]): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from('warnings')
        .update({
            resolved_at: new Date().toISOString(),
            resolved_by: (await supabase.auth.getUser()).data.user?.id
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
