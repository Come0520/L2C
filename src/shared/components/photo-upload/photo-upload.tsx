'use client';

import { Button } from '@/shared/ui/button';
import { X } from 'lucide-react';
import { UploadButton } from '@/shared/components/upload-button';

/**
 * 照片上传组件属性接口
 */
interface PhotoUploadProps {
  /** 已上传照片的 URL 数组 */
  value?: string[];
  /** 当照片列表发生变化时的回调函数 */
  onChange?: (value: string[]) => void;
  /** 允许上传的最大文件数量，默认为 5 */
  maxFiles?: number;
}

/**
 * 多图上传预览组件
 * 
 * @description
 * 支持多张照片的上传、预览、删除及自动客户端压缩。
 * 结合了 UploadButton 进行底层文件传输。
 * 
 * @example
 * ```tsx
 * <PhotoUpload value={images} onChange={setImages} maxFiles={10} />
 * ```
 */
export function PhotoUpload({ value = [], onChange, maxFiles = 5 }: PhotoUploadProps) {
  /**
   * 处理上传完成
   * @param url 上传成功的地址
   */
  const handleUploadComplete = (url: string) => {
    if (onChange) {
      onChange([...value, url]);
    }
  };

  /**
   * 移除指定索引的照片
   * @param index 照片索引
   */
  const handleRemove = (index: number) => {
    if (onChange) {
      const newValue = [...value];
      newValue.splice(index, 1);
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {value.map((url, index) => (
          <div key={index} className="group relative h-24 w-24 overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="已上传照片" className="h-full w-full object-cover" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-0 right-0 h-6 w-6 rounded-none rounded-bl-md opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => handleRemove(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {value.length < maxFiles && (
          <div className="h-24 w-24">
            <UploadButton
              onUploadComplete={handleUploadComplete}
              className="h-full w-full"
              label="上传"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 客户端图片压缩函数 (L5 性能优化)
 * 
 * @description
 * 使用 Canvas 进行客户端压缩：
 * 1. 限制最大宽度为 1920px
 * 2. 压缩质量设为 0.8
 * 3. 自动识别 JPEG/WebP 进行有损压缩，其他格式保持原样或转为 PNG
 * 
 * @param file 原始文件对象
 * @returns 压缩后的 Blob 对象（若压缩失败则返回原文件）
 */
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 限制最大宽度 1920px
        const MAX_WIDTH = 1920;
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // 针对 JPEG 和 WebP 进行质量压缩
        const mimeType = file.type === 'image/jpeg' || file.type === 'image/webp' ? file.type : 'image/png';
        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          mimeType,
          0.8
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
