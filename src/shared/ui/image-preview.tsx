'use client';

import React from 'react';
import Image from 'next/image';
import { Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/shared/ui/dialog';
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
export function ImagePreview({ src, alt, className, zoomClassName, fallback }: ImagePreviewProps) {
  if (!src) {
    return <>{fallback}</>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className={cn(
            'group relative cursor-zoom-in overflow-hidden transition-all duration-300',
            className
          )}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Hover Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/20">
            <Maximize2 className="h-5 w-5 scale-50 text-white opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-[90vw] overflow-hidden border-none bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">预览图片</DialogTitle>
        <div
          className={cn('relative flex h-[80vh] w-full items-center justify-center', zoomClassName)}
        >
          <Image src={src} alt={alt} fill className="object-contain" priority />
        </div>
      </DialogContent>
    </Dialog>
  );
}
