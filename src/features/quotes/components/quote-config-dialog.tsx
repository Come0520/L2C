'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { QuoteConfig } from '@/services/quote-config.service';
import { updateGlobalQuoteConfig, toggleQuoteMode, updateUserPlan } from '@/features/quotes/actions/config-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { logger } from '@/shared/lib/logger';
import { LinkageRule } from '@/services/quote-config.service';

interface QuoteConfigDialogProps {
    currentConfig?: QuoteConfig;
}

const AVAILABLE_FIELDS = [
    { id: 'foldRatio', label: '褶皱倍数' },
    { id: 'processFee', label: '加工费' },
    { id: 'remark', label: '备注' },
    { id: 'measuredWidth', label: '实测宽' },
    { id: 'measuredHeight', label: '实测高' },
    { id: 'fabricWidth', label: '面料幅宽' },
    { id: 'installMethod', label: '安装方式 (明/暗装)' },
    { id: 'openingStyle', label: '打开方式 (单/双开)' }
];

/**
 * BOM 预设模板：每个主材类别对应一组固定的可选组件，用户通过开关控制是否启用
 */
interface BomPresetComponent {
    targetCategory: string;
    label: string;
    description: string;
    defaultCalcLogic: 'FINISHED_WIDTH' | 'FINISHED_HEIGHT' | 'PROPORTIONAL' | 'FIXED';
}

const BOM_PRESETS: { value: string; label: string; components: BomPresetComponent[] }[] = [
    {
        value: 'CURTAIN', label: '窗帘',
        components: [
            { targetCategory: 'CURTAIN_TRACK', label: '轨道', description: '窗帘轨道 / 滑轨 / 罗马杆', defaultCalcLogic: 'FINISHED_WIDTH' },
            { targetCategory: 'SERVICE', label: '加工费', description: '制作、安装、裁剪等加工费用', defaultCalcLogic: 'FIXED' },
            { targetCategory: 'CURTAIN_ACCESSORY', label: '辅料', description: '挂钩、绑带、铅块等', defaultCalcLogic: 'FIXED' },
        ]
    },
    {
        value: 'WALLPAPER', label: '墙纸',
        components: [
            { targetCategory: 'WALL_ACCESSORY', label: '辅料', description: '墙纸胶、基膜等', defaultCalcLogic: 'PROPORTIONAL' },
            { targetCategory: 'SERVICE', label: '施工费', description: '铺贴施工人工费', defaultCalcLogic: 'PROPORTIONAL' },
        ]
    },
    {
        value: 'WALLCLOTH', label: '墙布',
        components: [
            { targetCategory: 'WALLCLOTH_ACCESSORY', label: '辅料', description: '墙布胶、基膜等', defaultCalcLogic: 'PROPORTIONAL' },
            { targetCategory: 'SERVICE', label: '施工费', description: '铺贴施工人工费', defaultCalcLogic: 'PROPORTIONAL' },
        ]
    },
    {
        value: 'BLIND', label: '功能帘',
        components: [
            { targetCategory: 'MOTOR', label: '电机', description: '电动开合电机', defaultCalcLogic: 'FIXED' },
            { targetCategory: 'SERVICE', label: '安装费', description: '安装人工费', defaultCalcLogic: 'FIXED' },
        ]
    },
    {
        value: 'SOFT_PACK', label: '软硬包',
        components: [
            { targetCategory: 'SERVICE', label: '安装费', description: '安装人工费', defaultCalcLogic: 'FIXED' },
            { targetCategory: 'HARDWARE', label: '五金', description: '挂件、螺丝等', defaultCalcLogic: 'FIXED' },
        ]
    },
    {
        value: 'WALLPANEL', label: '墙咔',
        components: [
            { targetCategory: 'PANEL_ACCESSORY', label: '附件', description: '墙咔配套附件', defaultCalcLogic: 'FIXED' },
            { targetCategory: 'SERVICE', label: '安装费', description: '安装人工费', defaultCalcLogic: 'FIXED' },
        ]
    },
    {
        value: 'MATTRESS', label: '床垫',
        components: [
            { targetCategory: 'STANDARD', label: '配套标品', description: '床笺、枕头等', defaultCalcLogic: 'FIXED' },
        ]
    },
];

export function QuoteConfigDialog({ currentConfig }: QuoteConfigDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    // State
    const [mode, setMode] = useState<'simple' | 'advanced'>(currentConfig?.mode || 'simple');
    const [selectedFields, setSelectedFields] = useState<string[]>(currentConfig?.visibleFields || []);
    const [defaultPlan, setDefaultPlan] = useState<'ECONOMIC' | 'COMFORT' | 'LUXURY'>(currentConfig?.defaultPlan || 'COMFORT');

    // Plan Settings State
    const [planSettings, setPlanSettings] = useState<Required<NonNullable<QuoteConfig['planSettings']>>>({
        ECONOMIC: currentConfig?.planSettings?.ECONOMIC || { markup: 0.15, quality: '经济实惠', description: '适合预算有限的客户' },
        COMFORT: currentConfig?.planSettings?.COMFORT || { markup: 0.30, quality: '舒适品质', description: '高性价比之选' },
        LUXURY: currentConfig?.planSettings?.LUXURY || { markup: 0.50, quality: '豪华尊享', description: '高端品质体验' }
    });

    // Loss Settings State
    const [curtainLoss, setCurtainLoss] = useState({
        side: currentConfig?.presetLoss?.curtain?.sideLoss ?? 5,
        bottom: currentConfig?.presetLoss?.curtain?.bottomLoss ?? 10,
        header: currentConfig?.presetLoss?.curtain?.headerLoss ?? 20
    });
    const [wallpaperLoss, setWallpaperLoss] = useState({
        width: currentConfig?.presetLoss?.wallpaper?.widthLoss ?? 20,
        cut: currentConfig?.presetLoss?.wallpaper?.cutLoss ?? 10
    });

    // BOM Templates
    const [bomTemplates, setBomTemplates] = useState<LinkageRule[]>(currentConfig?.bomTemplates || []);
    const [activeBomTab, setActiveBomTab] = useState(BOM_PRESETS[0].value);

    /** 检查某个组件在当前 bomTemplates 中是否已启用 */
    const isComponentEnabled = (mainCat: string, targetCat: string) =>
        bomTemplates.some(r => r.mainCategory === mainCat && r.targetCategory === targetCat);

    /** 切换某个组件的启用/禁用状态 */
    const toggleComponent = (mainCat: string, targetCat: string, defaultCalcLogic: string) => {
        const exists = bomTemplates.findIndex(
            r => r.mainCategory === mainCat && r.targetCategory === targetCat
        );
        if (exists >= 0) {
            // 关闭：移除该规则
            setBomTemplates(prev => prev.filter((_, i) => i !== exists));
        } else {
            // 开启：添加该规则
            setBomTemplates(prev => [...prev, {
                mainCategory: mainCat,
                targetCategory: targetCat,
                calcLogic: defaultCalcLogic as LinkageRule['calcLogic'],
            }]);
        }
    };

    const handleFieldToggle = (fieldId: string) => {
        setSelectedFields(prev =>
            prev.includes(fieldId)
                ? prev.filter(f => f !== fieldId)
                : [...prev, fieldId]
        );
    };

    const handleSave = async () => {
        try {
            // 1. Update Mode if changed (User Preference)
            if (mode !== currentConfig?.mode) {
                await toggleQuoteMode({ mode });
            }

            // 2. Update Default Plan if changed (User Preference)
            if (defaultPlan !== currentConfig?.defaultPlan) {
                await updateUserPlan({ plan: defaultPlan });
            }

            // 3. Update Global/Tenant Config
            const presetLoss = {
                curtain: {
                    sideLoss: Number(curtainLoss.side),
                    bottomLoss: Number(curtainLoss.bottom),
                    headerLoss: Number(curtainLoss.header)
                },
                wallpaper: {
                    widthLoss: Number(wallpaperLoss.width),
                    cutLoss: Number(wallpaperLoss.cut)
                }
            };

            await updateGlobalQuoteConfig({
                visibleFields: selectedFields,
                presetLoss,
                defaultPlan, // Also update global default
                planSettings,
                bomTemplates
            });

            toast.success('配置已保存');
            setOpen(false);
            router.refresh();
        } catch (error) {
            logger.error(error);
            toast.error('保存失败');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="报价配置">
                    <Settings2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]" resizable>
                <DialogHeader>
                    <DialogTitle>报价系统配置</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">通用设置</TabsTrigger>
                        <TabsTrigger value="calculation">计算参数</TabsTrigger>
                        {/* <TabsTrigger value="plans" disabled={mode === 'simple'}>方案配置</TabsTrigger> */}
                        <TabsTrigger value="bom">BOM联动</TabsTrigger>
                    </TabsList>

                    {/* General Settings */}
                    <TabsContent value="general" className="space-y-4 py-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>报价模式</Label>
                                            <Select value={mode} onValueChange={(v: 'simple' | 'advanced') => setMode(v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="simple">极简模式</SelectItem>
                                                    <SelectItem value="advanced">专业模式</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>默认方案</Label>
                                            <Select value={defaultPlan} onValueChange={(v: 'ECONOMIC' | 'COMFORT' | 'LUXURY') => setDefaultPlan(v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ECONOMIC">经济型</SelectItem>
                                                    <SelectItem value="COMFORT">舒适型</SelectItem>
                                                    <SelectItem value="LUXURY">豪华型</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        极简模式隐藏实测数据和复杂参数。专业模式支持三级价格方案切换。
                                    </p>

                                    <div className="space-y-3">
                                        <Label>显示字段</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {AVAILABLE_FIELDS.map((field) => (
                                                <div key={field.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={field.id}
                                                        checked={selectedFields.includes(field.id)}
                                                        onCheckedChange={() => handleFieldToggle(field.id)}
                                                    />
                                                    <Label htmlFor={field.id} className="text-sm font-normal cursor-pointer">
                                                        {field.label}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Calculation Settings */}
                    <TabsContent value="calculation" className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground mb-4">
                            设定默认的损耗参数，用于自动计算用量。
                        </p>

                        <div className="grid gap-6">
                            {/* Curtain Loss */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm border-b pb-1">窗帘损耗 (cm)</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="curtain-side" className="text-xs">单边损耗</Label>
                                        <Input
                                            id="curtain-side"
                                            type="number"
                                            value={curtainLoss.side}
                                            onChange={(e) => setCurtainLoss({ ...curtainLoss, side: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="curtain-bottom" className="text-xs">底边损耗</Label>
                                        <Input
                                            id="curtain-bottom"
                                            type="number"
                                            value={curtainLoss.bottom}
                                            onChange={(e) => setCurtainLoss({ ...curtainLoss, bottom: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="curtain-header" className="text-xs">帘头损耗</Label>
                                        <Input
                                            id="curtain-header"
                                            type="number"
                                            value={curtainLoss.header}
                                            onChange={(e) => setCurtainLoss({ ...curtainLoss, header: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Wallpaper Loss */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm border-b pb-1">墙纸/墙布损耗 (cm)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="wp-width" className="text-xs">宽度损耗</Label>
                                        <Input
                                            id="wp-width"
                                            type="number"
                                            value={wallpaperLoss.width}
                                            onChange={(e) => setWallpaperLoss({ ...wallpaperLoss, width: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="wp-cut" className="text-xs">裁剪损耗</Label>
                                        <Input
                                            id="wp-cut"
                                            type="number"
                                            value={wallpaperLoss.cut}
                                            onChange={(e) => setWallpaperLoss({ ...wallpaperLoss, cut: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* 方案配置 - 暂时隐藏，后续完善后再开放
                    <TabsContent value="plans" className="space-y-4 py-4 max-h-[400px] overflow-y-auto pr-2">
                        ...
                    </TabsContent>
                    */}

                    {/* BOM Settings - 预设组件 + 开关模式 */}
                    <TabsContent value="bom" className="space-y-3 py-4 max-h-[450px] overflow-y-auto pr-2">
                        <p className="text-sm text-muted-foreground mb-3">
                            选择主材类别，通过开关控制添加该商品时自动带出哪些配套组件。全部关闭则不启用 BOM。
                        </p>

                        {/* 主材类别 Tab 按钮栏 */}
                        <div className="flex flex-wrap gap-1.5 border-b pb-2">
                            {BOM_PRESETS.map((preset) => {
                                const enabledCount = preset.components.filter(
                                    c => isComponentEnabled(preset.value, c.targetCategory)
                                ).length;
                                return (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        onClick={() => setActiveBomTab(preset.value)}
                                        className={`px-3 py-1.5 text-xs rounded-md border transition-all ${activeBomTab === preset.value
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm font-medium'
                                            : 'bg-background hover:bg-muted border-border text-muted-foreground'
                                            }`}
                                    >
                                        {preset.label}
                                        {enabledCount > 0 && (
                                            <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${activeBomTab === preset.value
                                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                                : 'bg-muted-foreground/15 text-muted-foreground'
                                                }`}>{enabledCount}/{preset.components.length}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 当前类别下的组件开关列表 */}
                        {(() => {
                            const currentPreset = BOM_PRESETS.find(p => p.value === activeBomTab);
                            if (!currentPreset) return null;

                            return (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-foreground">
                                        添加「{currentPreset.label}」时自动带出：
                                    </h4>
                                    {currentPreset.components.map((comp) => {
                                        const enabled = isComponentEnabled(currentPreset.value, comp.targetCategory);
                                        return (
                                            <div
                                                key={comp.targetCategory}
                                                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${enabled ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border'
                                                    }`}
                                            >
                                                <div className="space-y-0.5">
                                                    <span className={`text-sm font-medium ${enabled ? 'text-foreground' : 'text-muted-foreground'
                                                        }`}>{comp.label}</span>
                                                    <p className="text-xs text-muted-foreground">{comp.description}</p>
                                                </div>
                                                <Switch
                                                    checked={enabled}
                                                    onCheckedChange={() => toggleComponent(
                                                        currentPreset.value,
                                                        comp.targetCategory,
                                                        comp.defaultCalcLogic
                                                    )}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </TabsContent>
                </Tabs>


                <div className="flex justify-end gap-2 mt-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                    <Button onClick={handleSave}>保存全部配置</Button>
                </div>
            </DialogContent>
        </Dialog >
    );
}
