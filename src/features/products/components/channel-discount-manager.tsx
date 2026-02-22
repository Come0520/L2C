'use client';

import { logger } from "@/shared/lib/logger";
import { useState, useEffect, useCallback } from 'react';
import {
    getGlobalDiscountConfig,
    updateGlobalDiscountConfig,
    getDiscountOverrides,
    createDiscountOverride,
    updateDiscountOverride,
    deleteDiscountOverride,
} from '../actions/channel-discount-actions';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { toast } from 'sonner';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Save from 'lucide-react/dist/esm/icons/save';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Settings from 'lucide-react/dist/esm/icons/settings';

/**
 * 渠道等级
 */
const CHANNEL_LEVELS = [
    { value: 'S', label: 'S级', description: '战略合作伙伴' },
    { value: 'A', label: 'A级', description: '核心渠道' },
    { value: 'B', label: 'B级', description: '普通渠道' },
    { value: 'C', label: 'C级', description: '新渠道' },
] as const;

/**
 * 覆盖规则类型
 */
interface DiscountOverride {
    id: string;
    scope: 'CATEGORY' | 'PRODUCT';
    targetId: string;
    targetName: string | null;
    sLevelDiscount: string | null;
    aLevelDiscount: string | null;
    bLevelDiscount: string | null;
    cLevelDiscount: string | null;
}

/**
 * 渠道等级折扣管理组件
 * 
 * 功能：
 * - 配置全局默认折扣率
 * - 按品类/商品覆盖折扣率
 * - 特殊规则配置
 */
export function ChannelDiscountManager() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 全局默认折扣配置
    const [globalDiscounts, setGlobalDiscounts] = useState({
        sLevel: 95,
        aLevel: 98,
        bLevel: 100,
        cLevel: 102,
    });

    // 覆盖规则列表
    const [overrides, setOverrides] = useState<DiscountOverride[]>([]);

    // 特殊规则
    const [specialRules, setSpecialRules] = useState({
        packageNoDiscount: true,
        bundleSeparateDiscount: true,
    });

    // 新增覆盖规则表单
    const [newOverride, setNewOverride] = useState({
        scope: 'CATEGORY' as 'CATEGORY' | 'PRODUCT',
        targetId: '',
    });

    // 加入中状态
    const [addingOverride, setAddingOverride] = useState(false);

    /**
     * 加载配置
     */
    const loadConfig = useCallback(async () => {
        setLoading(true);
        try {
            // 加载全局配置
            const globalResult = await getGlobalDiscountConfig();
            if (globalResult.data) {
                setGlobalDiscounts({
                    sLevel: globalResult.data.sLevel,
                    aLevel: globalResult.data.aLevel,
                    bLevel: globalResult.data.bLevel,
                    cLevel: globalResult.data.cLevel,
                });
                setSpecialRules({
                    packageNoDiscount: globalResult.data.packageNoDiscount ?? true,
                    bundleSeparateDiscount: globalResult.data.bundleSeparateDiscount ?? true,
                });
            }

            // 加载覆盖规则
            const overridesResult = await getDiscountOverrides();
            if (overridesResult.data) {
                setOverrides(overridesResult.data as DiscountOverride[]);
            }
        } catch (_error) {
            toast.error('加载失败', { description: '无法加载折扣配置' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    /**
     * 保存全局配置
     */
    const handleSaveGlobal = async () => {
        setSaving(true);
        try {
            const result = await updateGlobalDiscountConfig({
                ...globalDiscounts,
                ...specialRules,
            });

            if (result.error) {
                throw new Error(result.error);
            }

            toast.success('保存成功', { description: '全局折扣配置已更新' });
        } catch (error) {
            toast.error('保存失败', {
                description: error instanceof Error ? error.message : '无法保存全局折扣配置'
            });
        } finally {
            setSaving(false);
        }
    };

    /**
     * 新增覆盖规则
     */
    const handleAddOverride = async () => {
        if (!newOverride.targetId) {
            toast.error('请选择目标');
            return;
        }

        setAddingOverride(true);
        try {
            // 获取目标名称
            const targetName = getTargetName(newOverride.scope, newOverride.targetId);

            const result = await createDiscountOverride({
                scope: newOverride.scope,
                targetId: newOverride.targetId,
                targetName,
                sLevelDiscount: globalDiscounts.sLevel,
                aLevelDiscount: globalDiscounts.aLevel,
                bLevelDiscount: globalDiscounts.bLevel,
                cLevelDiscount: globalDiscounts.cLevel,
            });

            if (result.error) {
                throw new Error(result.error);
            }

            toast.success('添加成功');
            setNewOverride({ scope: 'CATEGORY', targetId: '' });
            loadConfig();
        } catch (error) {
            toast.error('添加失败', {
                description: error instanceof Error ? error.message : '无法添加覆盖规则'
            });
        } finally {
            setAddingOverride(false);
        }
    };

    /**
     * 删除覆盖规则
     */
    const handleDeleteOverride = async (id: string) => {
        try {
            const result = await deleteDiscountOverride(id);
            if (result.error) {
                throw new Error(result.error);
            }

            setOverrides(overrides.filter(o => o.id !== id));
            toast.success('删除成功');
        } catch (error) {
            toast.error('删除失败', {
                description: error instanceof Error ? error.message : '无法删除覆盖规则'
            });
        }
    };

    /**
     * 更新覆盖规则折扣值
     */
    const handleUpdateOverrideDiscount = async (
        id: string,
        level: 'sLevelDiscount' | 'aLevelDiscount' | 'bLevelDiscount' | 'cLevelDiscount',
        value: number
    ) => {
        // 先更新本地状态
        setOverrides(overrides.map(o =>
            o.id === id ? { ...o, [level]: value.toString() } : o
        ));

        // 异步更新服务器
        try {
            await updateDiscountOverride(id, {
                [level.replace('Discount', '')]: value
            });
        } catch (_error) {
            // 静默失败，用户可手动重试
        }
    };

    /**
     * 获取目标名称
     */
    const getTargetName = (scope: string, targetId: string): string => {
        if (scope === 'CATEGORY') {
            const categoryNames: Record<string, string> = {
                'CURTAIN_FABRIC': '窗帘布料',
                'CURTAIN_SHEER': '窗帘纱',
                'WALLCLOTH': '墙布',
                'CURTAIN_TRACK': '窗帘轨道',
            };
            return categoryNames[targetId] || targetId;
        }
        // 商品名称需要从数据库获取，暂时返回ID
        return `商品 ${targetId}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 全局默认折扣 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        全局默认折扣
                    </CardTitle>
                    <CardDescription>
                        配置 S/A/B/C 四个等级渠道的默认折扣率（100% = 无折扣）
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                        {CHANNEL_LEVELS.map((level) => (
                            <div key={level.value} className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Badge variant={level.value === 'S' ? 'default' : 'outline'}>
                                        {level.label}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {level.description}
                                    </span>
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={200}
                                        value={globalDiscounts[`${level.value.toLowerCase()}Level` as keyof typeof globalDiscounts]}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGlobalDiscounts({
                                            ...globalDiscounts,
                                            [`${level.value.toLowerCase()}Level`]: Number(e.target.value),
                                        })}
                                        className="w-24"
                                    />
                                    <span className="text-muted-foreground">%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button onClick={handleSaveGlobal} disabled={saving}>
                            {saving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            保存全局配置
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 覆盖规则 */}
            <Card>
                <CardHeader>
                    <CardTitle>品类/商品覆盖规则</CardTitle>
                    <CardDescription>
                        为特定品类或商品设置不同的折扣率，覆盖全局配置
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* 新增规则 */}
                    <div className="flex items-end gap-4 p-4 border rounded-lg bg-muted/30">
                        <div className="space-y-2">
                            <Label>覆盖范围</Label>
                            <Select
                                value={newOverride.scope}
                                onValueChange={(value: string) =>
                                    setNewOverride({ ...newOverride, scope: value as 'CATEGORY' | 'PRODUCT' })
                                }
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CATEGORY">品类</SelectItem>
                                    <SelectItem value="PRODUCT">商品</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label>选择目标</Label>
                            <Select
                                value={newOverride.targetId}
                                onValueChange={(value: string) =>
                                    setNewOverride({ ...newOverride, targetId: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={newOverride.scope === 'CATEGORY' ? '选择品类' : '选择商品'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {newOverride.scope === 'CATEGORY' ? (
                                        <>
                                            <SelectItem value="CURTAIN_FABRIC">窗帘布料</SelectItem>
                                            <SelectItem value="CURTAIN_SHEER">窗帘纱</SelectItem>
                                            <SelectItem value="WALLCLOTH">墙布</SelectItem>
                                            <SelectItem value="CURTAIN_TRACK">窗帘轨道</SelectItem>
                                        </>
                                    ) : (
                                        <>
                                            <SelectItem value="p1">高密度遮光布-米白</SelectItem>
                                            <SelectItem value="p2">雪尼尔绒布-灰色</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleAddOverride} disabled={addingOverride}>
                            {addingOverride ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4 mr-2" />
                            )}
                            添加规则
                        </Button>
                    </div>

                    {/* 规则列表 */}
                    {overrides.length > 0 && (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>范围</TableHead>
                                        <TableHead>对象</TableHead>
                                        <TableHead className="text-center">S级</TableHead>
                                        <TableHead className="text-center">A级</TableHead>
                                        <TableHead className="text-center">B级</TableHead>
                                        <TableHead className="text-center">C级</TableHead>
                                        <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {overrides.map((override) => (
                                        <TableRow key={override.id}>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {override.scope === 'CATEGORY' ? '品类' : '商品'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {override.targetName || override.targetId}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={200}
                                                    value={override.sLevelDiscount || ''}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                        handleUpdateOverrideDiscount(override.id, 'sLevelDiscount', Number(e.target.value))
                                                    }
                                                    className="w-16 text-center mx-auto"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={200}
                                                    value={override.aLevelDiscount || ''}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                        handleUpdateOverrideDiscount(override.id, 'aLevelDiscount', Number(e.target.value))
                                                    }
                                                    className="w-16 text-center mx-auto"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={200}
                                                    value={override.bLevelDiscount || ''}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                        handleUpdateOverrideDiscount(override.id, 'bLevelDiscount', Number(e.target.value))
                                                    }
                                                    className="w-16 text-center mx-auto"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={200}
                                                    value={override.cLevelDiscount || ''}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                        handleUpdateOverrideDiscount(override.id, 'cLevelDiscount', Number(e.target.value))
                                                    }
                                                    className="w-16 text-center mx-auto"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteOverride(override.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 特殊规则 */}
            <Card>
                <CardHeader>
                    <CardTitle>特殊规则</CardTitle>
                    <CardDescription>
                        配置折扣计算的特殊规则
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="packageNoDiscount"
                            checked={specialRules.packageNoDiscount}
                            onCheckedChange={(checked) =>
                                setSpecialRules({ ...specialRules, packageNoDiscount: checked === true })
                            }
                        />
                        <Label htmlFor="packageNoDiscount" className="cursor-pointer">
                            套餐商品不参与渠道折扣
                            <span className="text-muted-foreground text-sm ml-2">
                                （套餐价已是优惠价，不再叠加渠道折扣）
                            </span>
                        </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="bundleSeparateDiscount"
                            checked={specialRules.bundleSeparateDiscount}
                            onCheckedChange={(checked) =>
                                setSpecialRules({ ...specialRules, bundleSeparateDiscount: checked === true })
                            }
                        />
                        <Label htmlFor="bundleSeparateDiscount" className="cursor-pointer">
                            组合商品按子商品分别计算折扣
                            <span className="text-muted-foreground text-sm ml-2">
                                （每个子商品按各自的折扣规则计算）
                            </span>
                        </Label>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
