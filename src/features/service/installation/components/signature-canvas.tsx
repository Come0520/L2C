'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import type SignatureCanvasLib from 'react-signature-canvas';

/**
 * 签名画布组件属性
 */
interface SignatureCanvasProps {
    /** 确认签名时的回调，返回签名图片的 Blob 对象 */
    onConfirm: (blob: Blob) => void;
    /** 取消签名的回调 */
    onCancel: () => void;
    /** 自定义样式类名 */
    className?: string;
}

const ReactSignatureCanvas = dynamic(() => import('react-signature-canvas'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-muted/20 animate-pulse rounded-lg" />
});

/**
 * 基础签名画布组件
 * 
 * 提供手写签名功能，基于 `react-signature-canvas` 实现。
 * 支持响应式尺寸调整，并自动处理 SSR 环境兼容性。
 */
export function SignatureCanvas({ onConfirm, onCancel, className }: SignatureCanvasProps) {
    const sigCanvas = useRef<SignatureCanvasLib>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 500, height: 200 });

    // Handle responsive resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setCanvasSize({
                    width: containerRef.current.offsetWidth,
                    height: 200 // Fixed height
                });
            }
        };

        window.addEventListener('resize', updateSize);
        updateSize(); // Initial size

        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const clear = () => {
        sigCanvas.current?.clear();
    };

    const confirm = () => {
        if (sigCanvas.current?.isEmpty()) {
            // Optional: Alert empty
            return;
        }

        // Get blob (standard format)
        sigCanvas.current?.getTrimmedCanvas().toBlob((blob: Blob | null) => {
            if (blob) {
                onConfirm(blob);
            }
        }, 'image/png');
    };

    const SignaturePad = ReactSignatureCanvas as unknown as React.ElementType;

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <div
                ref={containerRef}
                className="border-2 border-dashed border-border rounded-lg bg-muted/10 overflow-hidden touch-none"
                style={{ height: canvasSize.height }}
            >
                <SignaturePad
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

            <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                <span>请客户在上方区域签名</span>
                <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground hover:text-destructive">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    清除重签
                </Button>
            </div>

            <div className="flex gap-2 justify-end mt-2">
                <Button variant="outline" onClick={onCancel}>
                    <X className="w-4 h-4 mr-2" />
                    取消
                </Button>
                <Button onClick={confirm}>
                    <Check className="w-4 h-4 mr-2" />
                    确认签名
                </Button>
            </div>
        </div>
    );
}
