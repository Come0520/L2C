'use client';

/**
 * 离线签名存储服务
 * 
 * 功能：
 * 1. 弱网环境下暂存签名到 localStorage
 * 2. 网络恢复后自动上传
 * 3. 支持重试机制
 */

// 存储键名
const STORAGE_KEY = 'offline_signatures';

/**
 * 待上传的签名记录
 */
export interface PendingSignature {
    /** 唯一标识 */
    id: string;
    /** 安装任务 ID */
    taskId: string;
    /** 签名数据（Base64 编码） */
    signatureData: string;
    /** 创建时间 */
    createdAt: string;
    /** 重试次数 */
    retryCount: number;
    /** 最后一次尝试时间 */
    lastAttempt?: string;
    /** 状态 */
    status: 'pending' | 'uploading' | 'failed';
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
    return `sig_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 从 localStorage 获取所有待上传签名
 */
export function getPendingSignatures(): PendingSignature[] {
    if (typeof window === 'undefined') return [];

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * 保存待上传签名列表
 */
function savePendingSignatures(signatures: PendingSignature[]): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(signatures));
    } catch (error) {
        console.error('保存离线签名失败:', error);
    }
}

/**
 * 将 Blob 转换为 Base64
 */
export async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * 将 Base64 转换为 Blob
 */
export function base64ToBlob(base64: string): Blob {
    const parts = base64.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
    }

    return new Blob([u8arr], { type: mime });
}

/**
 * 暂存签名到本地（弱网环境使用）
 * 
 * @param taskId - 安装任务 ID
 * @param signatureBlob - 签名 Blob 数据
 * @returns 存储的签名 ID
 */
export async function cacheSignatureOffline(
    taskId: string,
    signatureBlob: Blob
): Promise<string> {
    const signatureData = await blobToBase64(signatureBlob);
    const id = generateId();

    const signature: PendingSignature = {
        id,
        taskId,
        signatureData,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        status: 'pending',
    };

    const pending = getPendingSignatures();
    pending.push(signature);
    savePendingSignatures(pending);

    console.log(`[离线签名] 已暂存签名 ${id}，任务: ${taskId}`);

    return id;
}

/**
 * 移除已成功上传的签名
 */
export function removeSignature(id: string): void {
    const pending = getPendingSignatures();
    const filtered = pending.filter(s => s.id !== id);
    savePendingSignatures(filtered);
}

/**
 * 更新签名状态
 */
export function updateSignatureStatus(
    id: string,
    status: PendingSignature['status'],
    retryCount?: number
): void {
    const pending = getPendingSignatures();
    const index = pending.findIndex(s => s.id === id);

    if (index !== -1) {
        pending[index].status = status;
        pending[index].lastAttempt = new Date().toISOString();
        if (retryCount !== undefined) {
            pending[index].retryCount = retryCount;
        }
        savePendingSignatures(pending);
    }
}

/**
 * 检查网络状态
 */
export function isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
}

/**
 * 上传单个签名
 * 
 * @param signature - 待上传签名
 * @param uploadFn - 上传函数
 * @returns 是否成功
 */
export async function uploadSignature(
    signature: PendingSignature,
    uploadFn: (taskId: string, blob: Blob) => Promise<{ success: boolean; error?: string }>
): Promise<boolean> {
    if (!isOnline()) {
        console.log(`[离线签名] 网络离线，跳过上传 ${signature.id}`);
        return false;
    }

    updateSignatureStatus(signature.id, 'uploading');

    try {
        const blob = base64ToBlob(signature.signatureData);
        const result = await uploadFn(signature.taskId, blob);

        if (result.success) {
            removeSignature(signature.id);
            console.log(`[离线签名] 上传成功 ${signature.id}`);
            return true;
        } else {
            updateSignatureStatus(signature.id, 'failed', signature.retryCount + 1);
            console.error(`[离线签名] 上传失败 ${signature.id}:`, result.error);
            return false;
        }
    } catch (error) {
        updateSignatureStatus(signature.id, 'failed', signature.retryCount + 1);
        console.error(`[离线签名] 上传异常 ${signature.id}:`, error);
        return false;
    }
}

/**
 * 同步所有待上传签名
 * 
 * @param uploadFn - 上传函数
 * @returns 同步结果
 */
export async function syncPendingSignatures(
    uploadFn: (taskId: string, blob: Blob) => Promise<{ success: boolean; error?: string }>
): Promise<{ total: number; success: number; failed: number }> {
    const pending = getPendingSignatures();

    if (pending.length === 0) {
        return { total: 0, success: 0, failed: 0 };
    }

    if (!isOnline()) {
        console.log('[离线签名] 网络离线，无法同步');
        return { total: pending.length, success: 0, failed: 0 };
    }

    console.log(`[离线签名] 开始同步 ${pending.length} 个待上传签名...`);

    let success = 0;
    let failed = 0;

    // 按创建时间排序，先处理旧的
    const sorted = pending.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // 过滤掉重试次数过多的（最多 5 次）
    const MAX_RETRY = 5;
    const toUpload = sorted.filter(s => s.retryCount < MAX_RETRY);

    for (const sig of toUpload) {
        const result = await uploadSignature(sig, uploadFn);
        if (result) {
            success++;
        } else {
            failed++;
        }

        // 稍微延迟，避免并发过多
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`[离线签名] 同步完成: 成功 ${success}, 失败 ${failed}`);

    return { total: pending.length, success, failed };
}

/**
 * 获取待上传签名数量
 */
export function getPendingCount(): number {
    return getPendingSignatures().length;
}

/**
 * 清空所有待上传签名（谨慎使用）
 */
export function clearAllPending(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}
