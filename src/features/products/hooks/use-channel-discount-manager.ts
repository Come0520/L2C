import { useState, useEffect, useCallback } from 'react';
import {
    getGlobalDiscountConfig,
    updateGlobalDiscountConfig,
    getDiscountOverrides,
    createDiscountOverride,
    updateDiscountOverride,
    deleteDiscountOverride,
} from '../actions/channel-discount-actions';
import { toast } from 'sonner';

/**
 * 覆盖规则类型
 */
export interface DiscountOverride {
    id: string;
    scope: 'CATEGORY' | 'PRODUCT';
    targetId: string;
    targetName: string | null;
    sLevelDiscount: string | null;
    aLevelDiscount: string | null;
    bLevelDiscount: string | null;
    cLevelDiscount: string | null;
}

export function useChannelDiscountManager() {
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
                description: error instanceof Error ? error.message : '无法保存全局折扣配置',
            });
        } finally {
            setSaving(false);
        }
    };

    /**
     * 获取目标名称
     */
    const getTargetName = (scope: string, targetId: string): string => {
        if (scope === 'CATEGORY') {
            const categoryNames: Record<string, string> = {
                CURTAIN_FABRIC: '窗帘布料',
                CURTAIN_SHEER: '窗帘纱',
                WALLCLOTH: '墙布',
                CURTAIN_TRACK: '窗帘轨道',
            };
            return categoryNames[targetId] || targetId;
        }
        // 商品名称需要从数据库获取，暂时返回ID
        return `商品 ${targetId}`;
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
                description: error instanceof Error ? error.message : '无法添加覆盖规则',
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

            setOverrides(overrides.filter((o) => o.id !== id));
            toast.success('删除成功');
        } catch (error) {
            toast.error('删除失败', {
                description: error instanceof Error ? error.message : '无法删除覆盖规则',
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
        setOverrides(overrides.map((o) => (o.id === id ? { ...o, [level]: value.toString() } : o)));

        // 异步更新服务器
        try {
            await updateDiscountOverride(id, {
                [level.replace('Discount', '')]: value,
            });
        } catch (_error) {
            // 静默失败，用户可手动重试
        }
    };

    return {
        loading,
        saving,
        globalDiscounts,
        setGlobalDiscounts,
        overrides,
        specialRules,
        setSpecialRules,
        newOverride,
        setNewOverride,
        addingOverride,
        handleSaveGlobal,
        handleAddOverride,
        handleDeleteOverride,
        handleUpdateOverrideDiscount,
    };
}
