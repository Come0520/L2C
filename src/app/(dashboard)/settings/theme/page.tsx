'use client';

import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

/**
 * 主题设置页面
 * 自定义系统外观主题
 */
export default function ThemeSettingsPage() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="主题设置"
                subtitle="自定义系统外观主题"
            />

            <Card>
                <CardHeader>
                    <CardTitle>外观模式</CardTitle>
                    <CardDescription>
                        选择您偏好的界面颜色模式
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        defaultValue={theme}
                        onValueChange={setTheme}
                        className="grid grid-cols-3 gap-4"
                    >
                        <div>
                            <RadioGroupItem
                                value="light"
                                id="light"
                                className="peer sr-only"
                            />
                            <Label
                                htmlFor="light"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <Sun className="mb-3 h-6 w-6" />
                                浅色模式
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem
                                value="dark"
                                id="dark"
                                className="peer sr-only"
                            />
                            <Label
                                htmlFor="dark"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <Moon className="mb-3 h-6 w-6" />
                                深色模式
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem
                                value="system"
                                id="system"
                                className="peer sr-only"
                            />
                            <Label
                                htmlFor="system"
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <Monitor className="mb-3 h-6 w-6" />
                                跟随系统
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>预览</CardTitle>
                    <CardDescription>
                        当前主题: {theme === 'light' ? '浅色模式' : theme === 'dark' ? '深色模式' : '跟随系统'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="rounded-lg border p-4 bg-background">
                            <div className="font-medium">背景色</div>
                            <div className="text-muted-foreground">Background</div>
                        </div>
                        <div className="rounded-lg border p-4 bg-card">
                            <div className="font-medium">卡片色</div>
                            <div className="text-muted-foreground">Card</div>
                        </div>
                        <div className="rounded-lg border p-4 bg-primary text-primary-foreground">
                            <div className="font-medium">主色调</div>
                            <div className="opacity-80">Primary</div>
                        </div>
                        <div className="rounded-lg border p-4 bg-muted">
                            <div className="font-medium">次要色</div>
                            <div className="text-muted-foreground">Muted</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
