'use client';


import { logger } from '@/shared/lib/logger';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import ReactSignatureCanvas from 'react-signature-canvas';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import Wifi from 'lucide-react/dist/esm/icons/wifi';
import WifiOff from 'lucide-react/dist/esm/icons/wifi-off';
import Cloud from 'lucide-react/dist/esm/icons/cloud';
import {
    cacheSignatureOffline,
    isOnline,
    getPendingCount
} from '../logic/offline-signature';
import { toast } from 'sonner';
import { Badge } from '@/shared/ui/badge';

interface OfflineSignatureCanvasProps {
    /** 安装任务 ID */
    taskId: string;
    /** 在线上传函数 */
    onUpload: (blob: Blob) => Promise<{ success: boolean; error?: string }>;
    /** 签名完成后回调（无论在线还是离线） */
    onComplete: () => void;
    /** 取消回调 */
    onCancel: () => void;
    className?: string;
}

/**
 * 离线增强版签名画布
 * 
 * 特性：
 * 1. 弱网环境自动暂存到本地
 * 2. 显示网络状态指示器
 * 3. 网络恢复后通知用户
 */
export function OfflineSignatureCanvas({
    taskId,
    onUpload,
    onComplete,
    onCancel,
    className
}: OfflineSignatureCanvasProps) {
    const sigCanvas = useRef<ReactSignatureCanvas>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 500, height: 200 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [networkStatus, setNetworkStatus] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);

    // 监听网络状态
    useEffect(() => {
        const updateStatus = () => {
            setNetworkStatus(isOnline());
            setPendingCount(getPendingCount());
        };

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();

        return () => {
            window.removeEventListener('online', updateStatus);
            window.removeEventListener('offline', updateStatus);
        };
    }, []);

    // 响应式尺寸调整
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setCanvasSize({
                    width: containerRef.current.offsetWidth,
                    height: 200
                });
            }
        };

        window.addEventListener('resize', updateSize);
        updateSize();

        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const clear = useCallback(() => {
        sigCanvas.current?.clear();
    }, []);

    const confirm = useCallback(async () => {
        if (sigCanvas.current?.isEmpty()) {
            toast.warning('请先签名');
            return;
        }

        setIsSubmitting(true);

        try {
            // 获取签名 Blob
            const canvas = sigCanvas.current?.getTrimmedCanvas();
            if (!canvas) {
                toast.error('获取签名失败');
                return;
            }

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, 'image/png');
            });

            if (!blob) {
                toast.error('生成签名图片失败');
                return;
            }

            // 判断网络状态
            if (isOnline()) {
                // 在线：直接上传
                const result = await onUpload(blob);

                if (result.success) {
                    toast.success('签名已上传');
                    onComplete();
                } else {
                    // 上传失败，暂存到本地
                    await cacheSignatureOffline(taskId, blob);
                    toast.warning('上传失败，签名已保存到本地，网络恢复后自动上传');
                    onComplete();
                }
            } else {
                // 离线：暂存到本地
                await cacheSignatureOffline(taskId, blob);
                toast.info('签名已保存到本地，网络恢复后自动上传');
                onComplete();
            }
        } catch (error) {
            logger.error('签名处理失败:', error);
            toast.error('签名处理失败');
        } finally {
            setIsSubmitting(false);
        }
    }, [taskId, onUpload, onComplete]);

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            {/* 网络状态指示器 */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    {networkStatus ? (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                            <Wifi className="w-3 h-3 mr-1" />
                            在线
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                            <WifiOff className="w-3 h-3 mr-1" />
                            离线
                        </Badge>
                    )}
                </div>
                {pendingCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                        <Cloud className="w-3 h-3 mr-1" />
                        {pendingCount} 个待上传
                    </Badge>
                )}
            </div>

            {/* 签名画布 */}
            <div
                ref={containerRef}
                className="border-2 border-dashed border-border rounded-lg bg-muted/10 overflow-hidden touch-none"
                style={{ height: canvasSize.height }}
            >
                <ReactSignatureCanvas
                    ref={sigCanvas}
                    canvasProps={useMemo(() => ({
                        width: canvasSize.width,
                        height: canvasSize.height,
                        className: 'signature-canvas'
                    }), [canvasSize.width, canvasSize.height])}
                    backgroundColor="rgba(255,255,255,1)"
                    penColor="black"
                    velocityFilterWeight={0.7}
                />
            </div>

            {/* 提示和操作 */}
            <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                <span>请客户在上方区域签名</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clear}
                    className="text-muted-foreground hover:text-destructive"
                    disabled={isSubmitting}
                >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    清除重签
                </Button>
            </div>

            {/* 离线说明 */}
            {!networkStatus && (
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    当前处于离线状态，签名将保存到本地，网络恢复后自动上传。
                </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2 justify-end mt-2">
                <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    <X className="w-4 h-4 mr-2" />
                    取消
                </Button>
                <Button onClick={confirm} disabled={isSubmitting}>
                    <Check className="w-4 h-4 mr-2" />
                    {isSubmitting ? '处理中...' : '确认签名'}
                </Button>
            </div>
        </div>
    );
}
