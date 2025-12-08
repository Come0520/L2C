import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient as createBrowserClient } from '@/lib/supabase/client'

import { handleSupabaseError, checkAuthError } from './error-handler'

/**
 * 获取当前登录用户
 */
export async function getCurrentUser(supabase?: SupabaseClient) {
    const client = supabase || createBrowserClient()
    const { data: { user }, error } = await client.auth.getUser()

    if (error) {
        throw new Error(error.message || '获取用户信息失败')
    }

    checkAuthError(user)
    return user!
}

/**
 * 分页查询辅助函数
 */
export interface PaginationParams {
    page: number
    pageSize: number
}

export interface PaginationResult<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

export async function paginatedQuery<T>(
    query: any,
    params: PaginationParams
): Promise<PaginationResult<T>> {
    const { page, pageSize } = params
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, count, error } = await query.range(from, to)

    if (error) {
        handleSupabaseError(error)
    }

    return {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
    }
}

/**
 * 单条记录查询（返回 null 而不是抛出错误）
 */
export async function getSingleOrNull<T>(query: any): Promise<T | null> {
    const { data, error } = await query.maybeSingle()

    if (error) {
        handleSupabaseError(error)
    }

    return data as T | null
}

/**
 * 单条记录查询（不存在时抛出错误）
 */
export async function getSingleOrThrow<T>(
    query: any,
    resourceName: string = '资源'
): Promise<T> {
    const { data, error } = await query.single()

    if (error) {
        if (error.code === 'PGRST116') {
            throw new Error(`${resourceName}不存在`)
        }
        handleSupabaseError(error)
    }

    return data as T
}

/**
 * 批量插入辅助函数
 */
export async function bulkInsert<T>(
    tableName: string,
    records: T[],
    supabase?: SupabaseClient
): Promise<T[]> {
    const client = supabase || createBrowserClient()

    const { data, error } = await client
        .from(tableName)
        .insert(records)
        .select()

    if (error) {
        handleSupabaseError(error)
    }

    return data as T[]
}

/**
 * 批量更新辅助函数
 */
export async function bulkUpdate<T>(
    tableName: string,
    updates: Array<{ id: string; data: any }>,
    supabase?: SupabaseClient
): Promise<T[]> {
    const client = supabase || createBrowserClient()
    const results: T[] = []

    for (const update of updates) {
        const { data, error } = await client
            .from(tableName)
            .update(update.data)
            .eq('id', update.id)
            .select()
            .single()

        if (error) {
            handleSupabaseError(error)
        }

        results.push(data as T)
    }

    return results
}

/**
 * RPC 调用辅助函数
 */
export async function callRpc<T>(
    functionName: string,
    params?: Record<string, any>,
    supabase?: SupabaseClient
): Promise<T> {
    const client = supabase || createBrowserClient()

    const { data, error } = await client.rpc(functionName, params)

    if (error) {
        handleSupabaseError(error)
    }

    return data as T
}

/**
 * 文件上传辅助函数
 */
export interface UploadFileOptions {
    bucket: string
    path: string
    file: File
    upsert?: boolean
}

export async function uploadFile(
    options: UploadFileOptions,
    supabase?: SupabaseClient
): Promise<string> {
    const client = supabase || createBrowserClient()
    const { bucket, path, file, upsert = false } = options

    const { error: uploadError } = await client.storage
        .from(bucket)
        .upload(path, file, { upsert })

    if (uploadError) {
        handleSupabaseError(uploadError as any)
    }

    const { data } = client.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
}

/**
 * 文件删除辅助函数
 */
export async function deleteFile(
    bucket: string,
    paths: string[],
    supabase?: SupabaseClient
): Promise<void> {
    const client = supabase || createBrowserClient()

    const { error } = await client.storage.from(bucket).remove(paths)

    if (error) {
        handleSupabaseError(error as any)
    }
}

/**
 * 实时订阅辅助函数
 */
export interface RealtimeSubscriptionOptions {
    table: string
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
    filter?: string
    callback: (payload: any) => void
}

// 定义postgres_changes事件的payload类型
export interface PostgresChangePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: Partial<T> | null;
  table: string;
  schema: string;
  commit_timestamp: string;
}

export function subscribeToTable(
    options: RealtimeSubscriptionOptions,
    supabase?: SupabaseClient
) {
    const client = supabase || createBrowserClient()
    const { table, event = '*', filter, callback } = options

    const channel = (client as any)
        .channel(`${table}-changes`)
        .on(
            'postgres_changes' as 'system', // 使用类型断言解决参数类型不匹配问题
            { event, schema: 'public', table, filter },
            (payload: PostgresChangePayload) => callback(payload)
        )
        .subscribe()

    return {
        unsubscribe: () => {
            client.removeChannel(channel)
        },
    }
}
