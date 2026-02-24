'use client';

import { useState } from 'react';
import { uploadFileAction } from '@/features/upload/actions/upload';
import { Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

/**
 * 上传按钮组件属性接口
 */
interface Props {
    /** 上传成功后的回调函数，参数为文件的访问 URL */
    onUploadComplete: (url: string) => void;
    /** 自定义样式类名 */
    className?: string;
    /** 按钮显示的文本标签，默认为 "上传图片" */
    label?: string;
}

/**
 * 通用文件上传按钮组件
 * 
 * @description
 * 提供一个带有拖拽交互特征的上传区域。支持图片预设过滤。
 * 包含上传状态反馈（加载动画）和基于 sonner 的消息提示。
 * 
 * @example
 * ```tsx
 * <UploadButton onUploadComplete={(url) => console.log(url)} label="上传凭证" />
 * ```
 */
export function UploadButton({ onUploadComplete, className, label = "上传图片" }: Props) {
    const [uploading, setUploading] = useState(false);

    /**
     * 处理文件选择变更
     * @param e 邮件变更事件
     */
    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await uploadFileAction(formData);
            if (res.success && res.url) {
                onUploadComplete(res.url);
                toast.success('上传成功');
            } else {
                toast.error(res.error || '上传失败');
            }
        } catch {
            toast.error('网络连接错误');
        } finally {
            setUploading(false);
            // 重置 input 以允许再次选择同一文件
            e.target.value = '';
        }
    }

    return (
        <div className={cn("relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer", className)}>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                disabled={uploading}
            />
            {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
                    <UploadCloud className="h-8 w-8" />
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-medium">{label}</span>
                        <span className="text-xs text-muted-foreground mt-1">点击或拖拽文件到此区域</span>
                        <span className="text-[10px] text-muted-foreground/60 mt-0.5">支持 JPG, PNG, GIF, WebP (最大 10MB)</span>
                    </div>
                </div>
            )}
        </div>
    );
}
