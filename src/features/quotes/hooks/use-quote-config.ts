'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { logger } from '@/shared/lib/logger';
import { QuoteConfig, LinkageRule } from '@/services/quote-config.service';
import {
  updateGlobalQuoteConfig,
  toggleQuoteMode,
  updateUserPlan,
} from '@/features/quotes/actions/config-actions';
import { BOM_PRESETS } from '../constants/quote-config';

/**
 * `useQuoteConfig` - 报价系统配置 Dialog 的状态与逻辑 Hook
 *
 * @description 将 `QuoteConfigDialog` 中所有状态管理和保存逻辑抽离，
 * 组件本身只负责 UI 渲染。
 */
export function useQuoteConfig(currentConfig?: QuoteConfig) {
  const router = useRouter();

  // ── 基础设置 ──────────────────────────────────────────────
  const [mode, setMode] = useState<'simple' | 'advanced'>(currentConfig?.mode || 'simple');
  const [selectedFields, setSelectedFields] = useState<string[]>(
    currentConfig?.visibleFields || []
  );
  const [defaultPlan, setDefaultPlan] = useState<'ECONOMIC' | 'COMFORT' | 'LUXURY'>(
    currentConfig?.defaultPlan || 'COMFORT'
  );

  // ── 方案加价配置 ──────────────────────────────────────────
  const [planSettings, setPlanSettings] = useState<
    Required<NonNullable<QuoteConfig['planSettings']>>
  >({
    ECONOMIC: currentConfig?.planSettings?.ECONOMIC || {
      markup: 0.15,
      quality: '经济实惠',
      description: '适合预算有限的客户',
    },
    COMFORT: currentConfig?.planSettings?.COMFORT || {
      markup: 0.3,
      quality: '舒适品质',
      description: '高性价比之选',
    },
    LUXURY: currentConfig?.planSettings?.LUXURY || {
      markup: 0.5,
      quality: '豪华尊享',
      description: '高端品质体验',
    },
  });

  // ── 损耗参数配置 ──────────────────────────────────────────
  const [curtainLoss, setCurtainLoss] = useState({
    side: currentConfig?.presetLoss?.curtain?.sideLoss ?? 5,
    bottom: currentConfig?.presetLoss?.curtain?.bottomLoss ?? 10,
    header: currentConfig?.presetLoss?.curtain?.headerLoss ?? 20,
  });
  const [wallpaperLoss, setWallpaperLoss] = useState({
    width: currentConfig?.presetLoss?.wallpaper?.widthLoss ?? 20,
    cut: currentConfig?.presetLoss?.wallpaper?.cutLoss ?? 10,
  });

  // ── BOM 联动模板 ──────────────────────────────────────────
  const [bomTemplates, setBomTemplates] = useState<LinkageRule[]>(
    currentConfig?.bomTemplates || []
  );
  const [activeBomTab, setActiveBomTab] = useState(BOM_PRESETS[0].value);

  // ── 字段显隐切换 ─────────────────────────────────────────
  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((f) => f !== fieldId) : [...prev, fieldId]
    );
  };

  // ── BOM 组件开关 ─────────────────────────────────────────
  /** 检查某个组件在当前 bomTemplates 中是否已启用 */
  const isComponentEnabled = (mainCat: string, targetCat: string) =>
    bomTemplates.some((r) => r.mainCategory === mainCat && r.targetCategory === targetCat);

  /** 切换某个组件的启用/禁用状态 */
  const toggleComponent = (mainCat: string, targetCat: string, defaultCalcLogic: string) => {
    const exists = bomTemplates.findIndex(
      (r) => r.mainCategory === mainCat && r.targetCategory === targetCat
    );
    if (exists >= 0) {
      setBomTemplates((prev) => prev.filter((_, i) => i !== exists));
    } else {
      setBomTemplates((prev) => [
        ...prev,
        {
          mainCategory: mainCat,
          targetCategory: targetCat,
          calcLogic: defaultCalcLogic as LinkageRule['calcLogic'],
        },
      ]);
    }
  };

  // ── 保存 ─────────────────────────────────────────────────
  const handleSave = async (onSuccess: () => void) => {
    try {
      if (mode !== currentConfig?.mode) {
        await toggleQuoteMode({ mode });
      }
      if (defaultPlan !== currentConfig?.defaultPlan) {
        await updateUserPlan({ plan: defaultPlan });
      }

      const presetLoss = {
        curtain: {
          sideLoss: Number(curtainLoss.side),
          bottomLoss: Number(curtainLoss.bottom),
          headerLoss: Number(curtainLoss.header),
        },
        wallpaper: {
          widthLoss: Number(wallpaperLoss.width),
          cutLoss: Number(wallpaperLoss.cut),
        },
      };

      await updateGlobalQuoteConfig({
        visibleFields: selectedFields,
        presetLoss,
        defaultPlan,
        planSettings,
        bomTemplates,
      });

      toast.success('配置已保存');
      onSuccess();
      router.refresh();
    } catch (error) {
      logger.error(error);
      toast.error('保存失败');
    }
  };

  return {
    // 基础设置
    mode,
    setMode,
    selectedFields,
    handleFieldToggle,
    defaultPlan,
    setDefaultPlan,
    // 方案配置
    planSettings,
    setPlanSettings,
    // 损耗配置
    curtainLoss,
    setCurtainLoss,
    wallpaperLoss,
    setWallpaperLoss,
    // BOM 配置
    bomTemplates,
    activeBomTab,
    setActiveBomTab,
    isComponentEnabled,
    toggleComponent,
    // 操作
    handleSave,
  };
}
