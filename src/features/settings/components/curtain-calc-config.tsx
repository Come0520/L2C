'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { toast } from 'sonner';
import { updateGlobalQuoteConfig } from '@/features/quotes/actions/config-actions';
import { Save, RotateCcw } from 'lucide-react';

/**
 * 窗帘计算参数配置项
 */
interface CurtainCalcConfig {
    sideLoss: number;
    bottomLoss: number;
    headerLossWrapped: number;
    headerLossAttached: number;
    defaultHeaderType: 'WRAPPED' | 'ATTACHED';
    defaultFoldRatio: number;
    heightWarningThreshold: number;
}

interface CurtainCalcConfigProps {
    /** 初始配置 */
    initialConfig?: Partial<CurtainCalcConfig>;
}

/**
 * 默认配置值
 */
const DEFAULT_CONFIG: CurtainCalcConfig = {
    sideLoss: 5,
    bottomLoss: 10,
    headerLossWrapped: 20,
    headerLossAttached: 7,
    defaultHeaderType: 'WRAPPED',
    defaultFoldRatio: 2,
    heightWarningThreshold: 275,
};

/**
 * 窗帘计算参数配置组件
 * 用于租户级别配置窗帘计算的默认参数
 */
export function CurtainCalcConfig({ initialConfig }: CurtainCalcConfigProps) {
    const [config, setConfig] = useState<CurtainCalcConfig>({
        ...DEFAULT_CONFIG,
        ...initialConfig,
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (key: keyof CurtainCalcConfig, value: number | string) => {
        setConfig(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateGlobalQuoteConfig({
                presetLoss: {
                    curtain: config,
                },
            });
            toast.success('窗帘计算参数已保存');
        } catch (error) {
            toast.error('保存失败，请重试');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setConfig(DEFAULT_CONFIG);
        toast.info('已重置为系统默认值');
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">窗帘计算参数</CardTitle>
                <CardDescription className="text-xs">
                    配置窗帘报价计算的默认损耗值和工艺参数，修改后对所有新报价生效
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* 损耗配置 */}
                <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">损耗配置</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="sideLoss">侧边损耗 (cm)</Label>
                            <Input
                                id="sideLoss"
                                type="number"
                                value={config.sideLoss}
                                onChange={e => handleChange('sideLoss', Number(e.target.value))}
                                min={0}
                                max={20}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bottomLoss">底边损耗 (cm)</Label>
                            <Input
                                id="bottomLoss"
                                type="number"
                                value={config.bottomLoss}
                                onChange={e => handleChange('bottomLoss', Number(e.target.value))}
                                min={0}
                                max={30}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="headerLossWrapped">包布带帘头 (cm)</Label>
                            <Input
                                id="headerLossWrapped"
                                type="number"
                                value={config.headerLossWrapped}
                                onChange={e => handleChange('headerLossWrapped', Number(e.target.value))}
                                min={0}
                                max={30}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="headerLossAttached">贴布带帘头 (cm)</Label>
                            <Input
                                id="headerLossAttached"
                                type="number"
                                value={config.headerLossAttached}
                                onChange={e => handleChange('headerLossAttached', Number(e.target.value))}
                                min={0}
                                max={20}
                            />
                        </div>
                    </div>
                </div>

                {/* 默认值配置 */}
                <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">默认值配置</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="defaultHeaderType">默认帘头工艺</Label>
                            <Select
                                value={config.defaultHeaderType}
                                onValueChange={value => handleChange('defaultHeaderType', value)}
                            >
                                <SelectTrigger id="defaultHeaderType">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="WRAPPED">包布带</SelectItem>
                                    <SelectItem value="ATTACHED">贴布带</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="defaultFoldRatio">默认褶皱倍数</Label>
                            <Select
                                value={config.defaultFoldRatio.toString()}
                                onValueChange={value => handleChange('defaultFoldRatio', Number(value))}
                            >
                                <SelectTrigger id="defaultFoldRatio">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1.5">1.5 倍</SelectItem>
                                    <SelectItem value="1.8">1.8 倍</SelectItem>
                                    <SelectItem value="2">2.0 倍</SelectItem>
                                    <SelectItem value="2.5">2.5 倍</SelectItem>
                                    <SelectItem value="3">3.0 倍</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="heightWarningThreshold">定高阈值 (cm)</Label>
                            <Input
                                id="heightWarningThreshold"
                                type="number"
                                value={config.heightWarningThreshold}
                                onChange={e => handleChange('heightWarningThreshold', Number(e.target.value))}
                                min={200}
                                max={350}
                            />
                            <p className="text-xs text-muted-foreground">超过此高度触发超高预警弹窗</p>
                        </div>
                    </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        重置默认
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        {isSaving ? '保存中...' : '保存配置'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
