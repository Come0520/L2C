'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { toast } from 'sonner';
import { getAttributionSettings, updateAttributionSettingsAction } from '../actions/settings';
import { Loader2 } from 'lucide-react';

type AttributionModel = 'FIRST_TOUCH' | 'LAST_TOUCH';

/**
 * 渠道归因规则配置表单
 * 设置系统如何判定客户来源及业绩归属
 */
export function AttributionSettingsForm() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [model, setModel] = useState<AttributionModel>('LAST_TOUCH');

    useEffect(() => {
        const load = async () => {
            try {
                const settings = await getAttributionSettings();
                setModel(settings.attributionModel as AttributionModel);
            } catch (_e) {
                // 加载失败静默处理
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await updateAttributionSettingsAction({ attributionModel: model });
            if (res?.data?.success) {
                toast.success('归因规则已更新');
            } else {
                toast.error(res?.error || '更新失败');
            }
        } catch {
            toast.error('更新失败');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[200px] flex items-center justify-center">
                <Loader2 className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>渠道归因规则配置</CardTitle>
                <CardDescription>设置系统如何判定客户来源及业绩归属</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <Label>归因模型</Label>
                        <RadioGroup
                            value={model}
                            onValueChange={(v) => setModel(v as AttributionModel)}
                            className="flex flex-col space-y-4"
                        >
                            <div className="flex items-start space-x-3">
                                <RadioGroupItem value="FIRST_TOUCH" id="first" className="mt-1" />
                                <div className="space-y-1">
                                    <Label htmlFor="first" className="font-normal cursor-pointer">
                                        首次触点归因 (First Touch)
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        业绩归属于最早录入该客户的渠道。适用于强调拉新能力。
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <RadioGroupItem value="LAST_TOUCH" id="last" className="mt-1" />
                                <div className="space-y-1">
                                    <Label htmlFor="last" className="font-normal cursor-pointer">
                                        末次触点归因 (Last Touch)
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        业绩归属于最终促成成交的渠道。适用于强调转化能力。（推荐）
                                    </p>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            保存配置
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
