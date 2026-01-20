'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { createApprovalFlow } from '@/features/approval/actions/flow';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';

export default function NewApprovalFlowPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !code) {
            toast.error('请填写必填项');
            return;
        }

        setLoading(true);
        try {
            const result = await createApprovalFlow({ name, code, description });
            if (result.success) {
                toast.success('创建成功');
                router.push('/settings/approvals');
            } else {
                toast.error('创建失败');
            }
        } catch (error) {
            toast.error('发生错误');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    返回
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">新建审批流程</h1>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">流程名称 <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="例如：大额报价审批"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">流程代码 (Code) <span className="text-red-500">*</span></Label>
                            <Input
                                id="code"
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase())}
                                placeholder="例如：QUOTE_DISCOUNT (需唯一)"
                            />
                            <p className="text-sm text-muted-foreground">用于系统自动触发，请使用大写英文字母和下划线。</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">描述</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="描述该流程的用途..."
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={loading}>
                                {loading ? '创建中...' : '确认创建'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
