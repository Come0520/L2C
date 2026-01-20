'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    getPendingCount,
    syncPendingSignatures,
    isOnline as checkOnline
} from '../logic/offline-signature';
import { toast } from 'sonner';

/**
 * 网络状态和离线签名同步 Hook
 * 
 * 功能：
 * 1. 监听网络状态变化
 * 2. 网络恢复时自动同步待上传签名
 * 3. 提供手动同步方法
 */
export function useOfflineSignatureSync(
    uploadFn: (taskId: string, blob: Blob) => Promise<{ success: boolean; error?: string }>
) {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    // 更新待上传数量
    const refreshPendingCount = useCallback(() => {
        setPendingCount(getPendingCount());
    }, []);

    // 执行同步
    const sync = useCallback(async (silent = false) => {
        if (isSyncing) return;

        const count = getPendingCount();
        if (count === 0) return;

        setIsSyncing(true);

        try {
            const result = await syncPendingSignatures(uploadFn);

            if (!silent && result.success > 0) {
                toast.success(`已同步 ${result.success} 个签名`);
            }

            if (!silent && result.failed > 0) {
                toast.warning(`${result.failed} 个签名同步失败，将稍后重试`);
            }

            refreshPendingCount();
        } catch (error) {
            console.error('同步签名失败:', error);
            if (!silent) {
                toast.error('签名同步失败');
            }
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, uploadFn, refreshPendingCount]);

    // 监听网络状态
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            console.log('[网络] 已恢复连接');

            // 网络恢复后自动同步
            const count = getPendingCount();
            if (count > 0) {
                toast.info(`检测到 ${count} 个待上传签名，正在同步...`);
                sync(true);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            console.log('[网络] 连接已断开');
            toast.warning('网络已断开，签名将自动保存到本地');
        };

        // 初始状态
        setIsOnline(checkOnline());
        refreshPendingCount();

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [sync, refreshPendingCount]);

    // 页面可见时检查并同步
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible' && checkOnline()) {
                const count = getPendingCount();
                if (count > 0) {
                    sync(true);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [sync]);

    return {
        /** 当前是否在线 */
        isOnline,
        /** 待上传签名数量 */
        pendingCount,
        /** 是否正在同步 */
        isSyncing,
        /** 手动触发同步 */
        sync: () => sync(false),
        /** 刷新待上传数量 */
        refreshPendingCount,
    };
}
