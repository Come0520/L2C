'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { toast } from 'sonner';
import { Loader2, Save, RotateCcw, Check, Eye } from 'lucide-react';
import {
    QUOTE_FIELDS,
    FIELD_GROUPS,
    DEFAULT_QUOTE_MODE_CONFIG,
    type QuoteModeConfig,
} from '../lib/quote-mode-constants';
import { getQuoteModeConfig, saveQuoteModeConfig } from '../actions/quote-config-actions';

/**
 * 快速报价字段配置组件
 * [Quote-01] 报价设置 > 快速报价字段配置
 * 
 * 功能：
 * - 按分组展示所有系统固定字段
 * - 勾选框选择在快速模式下显示的字段
 * - 实时预览快速模式表单效果
 * - 重置为系统默认按钮
 * - 保存配置到租户设置
 */
export function QuickQuoteFieldConfig() {
    const [config, setConfig] = useState<QuoteModeConfig>(DEFAULT_QUOTE_MODE_CONFIG);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // 加载配置
    useEffect(() => {
        const loadConfig = async () => {
            setIsLoading(true);
            try {
                const result = await getQuoteModeConfig();
                if (result.error) {
                    toast.error(result.error);
                } else if (result.data) {
                    setConfig(result.data);
                }
            } catch (error) {
                console.error('[QuickQuoteFieldConfig] Load error:', error);
                toast.error('加载配置失败');
            } finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, []);

    // 按分组整理字段
    const groupedFields = useMemo(() => {
        const groups: Record<string, typeof QUOTE_FIELDS[number][]> = {};
        for (const field of QUOTE_FIELDS) {
            if (!groups[field.group]) {
                groups[field.group] = [];
            }
            groups[field.group].push(field);
        }
        return groups;
    }, []);

    // 处理字段勾选
    const handleFieldToggle = (fieldId: string, checked: boolean) => {
        setConfig(prev => ({
            ...prev,
            quickModeFields: checked
                ? [...prev.quickModeFields, fieldId]
                : prev.quickModeFields.filter(id => id !== fieldId),
        }));
        setHasChanges(true);
    };

    // 重置为系统默认
    const handleReset = () => {
        setConfig(DEFAULT_QUOTE_MODE_CONFIG);
        setHasChanges(true);
        toast.info('已重置为系统默认配置，请点击保存应用');
    };

    // 保存配置
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await saveQuoteModeConfig(config);
            if (result.success) {
                toast.success('配置已保存');
                setHasChanges(false);
            } else {
                toast.error(result.error ?? '保存失败');
            }
        } catch (error) {
            console.error('[QuickQuoteFieldConfig] Save error:', error);
            toast.error('保存配置失败');
        } finally {
            setIsSaving(false);
        }
    };

    // 获取已选字段用于预览
    const selectedFields = useMemo(() => {
        return QUOTE_FIELDS.filter(f => config.quickModeFields.includes(f.id));
    }, [config.quickModeFields]);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：字段配置区 */}
            <div className="lg:col-span-2 space-y-4">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">快速报价字段配置</CardTitle>
                                <CardDescription className="text-xs">
                                    勾选在快速报价模式下显示的字段，未勾选的字段仅在高级模式显示
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReset}
                                    disabled={isSaving}
                                >
                                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                    重置默认
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isSaving || !hasChanges}
                                >
                                    {isSaving ? (
                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Save className="mr-1.5 h-3.5 w-3.5" />
                                    )}
                                    保存配置
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {Object.entries(FIELD_GROUPS)
                            .sort((a, b) => a[1].order - b[1].order)
                            .map(([groupKey, groupInfo]) => (
                                <div key={groupKey} className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        {groupInfo.label}
                                        <Badge variant="secondary" className="text-xs font-normal">
                                            {groupedFields[groupKey]?.filter(f => config.quickModeFields.includes(f.id)).length ?? 0}
                                            /{groupedFields[groupKey]?.length ?? 0}
                                        </Badge>
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {groupedFields[groupKey]?.map(field => (
                                            <label
                                                key={field.id}
                                                className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                                            >
                                                <Checkbox
                                                    checked={config.quickModeFields.includes(field.id)}
                                                    onCheckedChange={(checked) =>
                                                        handleFieldToggle(field.id, checked === true)
                                                    }
                                                />
                                                <span className="text-sm">
                                                    <span className="text-muted-foreground text-xs mr-1">
                                                        #{field.fieldNo}
                                                    </span>
                                                    {field.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    {groupKey !== 'remarks' && <Separator className="mt-4" />}
                                </div>
                            ))}
                    </CardContent>
                </Card>
            </div>

            {/* 右侧：实时预览区 */}
            <div className="space-y-4">
                <Card className="sticky top-4">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-base">快速模式预览</CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                            以下字段将在快速报价模式下显示
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(FIELD_GROUPS)
                                .sort((a, b) => a[1].order - b[1].order)
                                .map(([groupKey, groupInfo]) => {
                                    const groupFields = selectedFields.filter(f => f.group === groupKey);
                                    if (groupFields.length === 0) return null;
                                    return (
                                        <div key={groupKey} className="space-y-2">
                                            <h5 className="text-xs font-medium text-muted-foreground">
                                                {groupInfo.label}
                                            </h5>
                                            <div className="flex flex-wrap gap-1.5">
                                                {groupFields.map(field => (
                                                    <Badge
                                                        key={field.id}
                                                        variant="outline"
                                                        className="text-xs font-normal"
                                                    >
                                                        <Check className="h-3 w-3 mr-1 text-green-500" />
                                                        {field.label}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                            {selectedFields.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    请勾选至少一个字段
                                </p>
                            )}

                            <Separator className="my-3" />

                            <div className="text-xs text-muted-foreground space-y-1">
                                <p>
                                    <span className="font-medium">已选字段：</span>
                                    {selectedFields.length} / {QUOTE_FIELDS.length}
                                </p>
                                <p>
                                    <span className="font-medium">高级模式字段：</span>
                                    {QUOTE_FIELDS.length - selectedFields.length} 个
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
