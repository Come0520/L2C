'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';
import { Layout, Tag, X } from 'lucide-react';
import { saveQuoteAsTemplate } from '../actions/template-actions';
import { toast } from 'sonner';
import { logger } from '@/shared/lib/logger';

interface SaveAsTemplateDialogProps {
    quoteId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

/**
 * 保存为模板对话框
 * 用于将当前报价保存为可复用模板
 */
export function SaveAsTemplateDialog({
    quoteId,
    open,
    onOpenChange,
    onSuccess
}: SaveAsTemplateDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error('请输入模板名称');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await saveQuoteAsTemplate({
                quoteId,
                name: name.trim(),
                description: description.trim() || undefined,
                isPublic,
                tags
            });

            if (res?.data?.success) {
                toast.success(res.data.message || '模板保存成功');
                onOpenChange(false);
                onSuccess?.();
                // 重置表单
                setName('');
                setDescription('');
                setIsPublic(false);
                setTags([]);
            } else {
                toast.error('保存失败，请稍后重试');
            }
        } catch (e) {
            logger.error('[SaveTemplateError]', e);
            toast.error('系统异常');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Layout className="h-5 w-5 text-primary" />
                        保存为模板
                    </DialogTitle>
                    <DialogDescription>
                        将当前报价配置保存为模板，方便快速复用
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* 模板名称 */}
                    <div className="space-y-2">
                        <Label htmlFor="template-name">模板名称 *</Label>
                        <Input
                            id="template-name"
                            placeholder="例如：万科120平三室两厅套餐"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={200}
                        />
                    </div>

                    {/* 描述 */}
                    <div className="space-y-2">
                        <Label htmlFor="template-desc">适用场景说明</Label>
                        <Textarea
                            id="template-desc"
                            placeholder="例如：适用于万科都市花园A户型，含客厅落地窗、主卧飘窗、次卧普通窗..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* 标签 */}
                    <div className="space-y-2">
                        <Label>标签</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="输入标签后回车"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTag();
                                    }
                                }}
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleAddTag}
                            >
                                <Tag className="h-4 w-4" />
                            </Button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {tags.map(tag => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="pr-1 gap-1"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:bg-muted rounded-full p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 公开设置 */}
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                        <div>
                            <Label className="text-sm font-medium">团队共享</Label>
                            <p className="text-xs text-muted-foreground">
                                开启后团队其他成员也可以使用此模板
                            </p>
                        </div>
                        <Switch
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        取消
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !name.trim()}
                    >
                        {isSubmitting ? '保存中...' : '保存模板'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
