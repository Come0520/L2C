'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { createActivity } from '@/features/customers/actions/activities';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface Props {
    customerId: string;
    onSuccess: () => void;
}

const TYPES = [
    { value: 'CALL', label: '电话沟通' },
    { value: 'WECHAT', label: '微信沟通' },
    { value: 'VISIT', label: '上门拜访' },
    { value: 'OTHER', label: '其他' },
];

export function ActivityForm({ customerId, onSuccess }: Props) {
    const [description, setDescription] = useState('');
    const [type, setType] = useState('CALL');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit() {
        if (!description.trim()) return;

        setSubmitting(true);
        try {
            const res = await createActivity({
                customerId,
                type,
                description
            });

            if (res.success) {
                toast.success('跟进记录已保存');
                setDescription('');
                onSuccess();
            } else {
                toast.error(res.error || '保存失败');
            }
        } catch (e) {
            toast.error('网络错误');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
            <div className="flex gap-2">
                {TYPES.map(t => (
                    <button
                        key={t.value}
                        onClick={() => setType(t.value)}
                        className={cn(
                            "text-xs px-3 py-1.5 rounded-full border transition-all",
                            type === t.value
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground hover:bg-muted"
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <Textarea
                placeholder="记录跟进详情..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] resize-none bg-background focus:ring-1"
            />

            <div className="flex justify-end">
                <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={submitting || !description.trim()}
                    className="gap-2"
                >
                    {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    保存记录
                </Button>
            </div>
        </div>
    );
}
