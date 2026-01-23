'use client';

import { useTransition, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { toast } from 'sonner';
import { updateUserPreferences } from '@/features/settings/actions/preference-actions';
import { cn } from '@/shared/lib/utils';
import { useStyle } from '@/shared/providers/style-provider';

interface UserPreferenceSettingsProps {
    initialQuoteMode: 'PRODUCT_FIRST' | 'SPACE_FIRST';
}

export function UserPreferenceSettings({ initialQuoteMode }: UserPreferenceSettingsProps) {
    const [isPending, startTransition] = useTransition();
    const [currentMode, setCurrentMode] = useState(initialQuoteMode);

    const handleModeChange = (value: string) => {
        const newMode = value as 'PRODUCT_FIRST' | 'SPACE_FIRST';
        setCurrentMode(newMode);

        startTransition(async () => {
            const result = await updateUserPreferences({ quoteMode: newMode });
            if (result.success) {
                toast.success('偏好设置已更新');
            } else {
                toast.error(result.error ?? '更新失败');
                // 回滚 UI 状态
                setCurrentMode(initialQuoteMode);
            }
        });
    };

    const { style, setStyle } = useStyle();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>视觉风格</CardTitle>
                    <CardDescription>选择您喜欢的系统视觉风格</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={style}
                        onValueChange={(val) => setStyle(val as 'glass' | 'clay' | 'cute' | 'parchment')}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                        <div
                            className={cn(
                                "flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer transition-colors",
                                style === 'glass'
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-muted-foreground/50"
                            )}
                        >
                            <RadioGroupItem value="glass" id="style-glass" />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="style-glass" className="font-bold cursor-pointer">
                                    液态玻璃 (Liquid Glass)
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    现代、通透、流动的玻璃质感
                                </p>
                            </div>
                        </div>
                        <div
                            className={cn(
                                "flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer transition-colors",
                                style === 'clay'
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-muted-foreground/50"
                            )}
                        >
                            <RadioGroupItem value="clay" id="style-clay" />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="style-clay" className="font-bold cursor-pointer">
                                    柔和泥态 (Claymorphism)
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    柔和、圆润、立体的哑光质感
                                </p>
                            </div>
                        </div>
                        <div
                            className={cn(
                                "flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer transition-colors",
                                style === 'cute'
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-muted-foreground/50"
                            )}
                        >
                            <RadioGroupItem value="cute" id="style-cute" />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="style-cute" className="font-bold cursor-pointer">
                                    可爱主义 (Cute-alism)
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    萌系、俏皮、高弹性的视觉效果
                                </p>
                            </div>
                        </div>
                        <div
                            className={cn(
                                "flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer transition-colors",
                                style === 'parchment'
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-muted-foreground/50"
                            )}
                        >
                            <RadioGroupItem value="parchment" id="style-parchment" />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="style-parchment" className="font-bold cursor-pointer">
                                    书韵宣纸 (Parchmentism)
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    书香、墨韵、卷轴般的护眼体验
                                </p>
                            </div>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>报价偏好</CardTitle>
                    <CardDescription>选择您偏好的报价工作流程</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={currentMode}
                        onValueChange={handleModeChange}
                        disabled={isPending}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <div
                            className={cn(
                                "flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer transition-colors",
                                currentMode === 'PRODUCT_FIRST'
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-muted-foreground/50"
                            )}
                        >
                            <RadioGroupItem value="PRODUCT_FIRST" id="mode-product" />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="mode-product" className="font-bold cursor-pointer">
                                    产品优先
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    直接向报价单添加产品
                                </p>
                            </div>
                        </div>
                        <div
                            className={cn(
                                "flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer transition-colors",
                                currentMode === 'SPACE_FIRST'
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-muted-foreground/50"
                            )}
                        >
                            <RadioGroupItem value="SPACE_FIRST" id="mode-space" />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="mode-space" className="font-bold cursor-pointer">
                                    空间优先
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    按房间/空间组织产品
                                </p>
                            </div>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>
        </div>
    );
}

