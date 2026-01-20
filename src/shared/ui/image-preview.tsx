'use client';

import React from 'react';
import Image from 'next/image';
import { Maximize2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from '@/shared/ui/dialog';
import { cn } from '@/shared/lib/utils';

interface ImagePreviewProps {
    /** 图片源地址 */
    src: string;
    /** 图片替代文本 */
    alt: string;
    /** 缩略图容器样�?*/
    className?: string;
    /** 放大图容器样�?*/
    zoomClassName?: string;
    /** 缩略图占位组�?*/
    fallback?: React.ReactNode;
}

/**
 * 通用图片预览组件 (ImagePreview)
 * 点击缩略图弹出高清大图预览�?
 */
export function ImagePreview({
    src,
    alt,
    className,
    zoomClassName,
    fallback,
}: ImagePreviewProps) {
    if (!src) {
        return <>{fallback}</>;
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className={cn(
                    "relative group cursor-zoom-in overflow-hidden transition-all duration-300",
                    className
                )}>
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors duration-300">
                        <Maximize2 className="text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 h-5 w-5" />
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none">
                <div className={cn(
                    "relative w-full h-[80vh] flex items-center justify-center",
                    zoomClassName
                )}>
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

