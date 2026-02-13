'use client';

import { useForm } from "react-hook-form";
import { Form } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";

interface ChannelFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: any[];
}

/**
 * 渠道表单组件（待完善）
 * 用于新建/编辑渠道
 */
export function ChannelForm({ open, onOpenChange, categories }: ChannelFormProps) {
    const form = useForm();

    // 如果弹窗未打开，不渲染任何内容
    if (!open) return null;

    return (
        <div className="space-y-4">
            <p className="text-muted-foreground">渠道表单功能正在开发中，敬请期待。</p>
        </div>
    );
}
