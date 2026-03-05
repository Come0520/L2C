'use client';

import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { QuoteConfig } from '@/services/quote-config.service';
import { useQuoteConfig } from '../hooks/use-quote-config';
import { GeneralSettingsTab } from './quote-config-sections/GeneralSettingsTab';
import { CalculationSettingsTab } from './quote-config-sections/CalculationSettingsTab';
import { BomSettingsTab } from './quote-config-sections/BomSettingsTab';

interface QuoteConfigDialogProps {
  currentConfig?: QuoteConfig;
}

/**
 * 报价系统配置 Dialog
 *
 * @description 调度器组件，只负责 Dialog 的开关状态和 Tab 布局。
 * 所有状态管理逻辑委托给 `useQuoteConfig` Hook，
 * 各 Tab 面板的 UI 渲染委托给 `quote-config-sections/` 目录下的子组件。
 */
export function QuoteConfigDialog({ currentConfig }: QuoteConfigDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    mode,
    setMode,
    selectedFields,
    handleFieldToggle,
    defaultPlan,
    setDefaultPlan,
    curtainLoss,
    setCurtainLoss,
    wallpaperLoss,
    setWallpaperLoss,
    activeBomTab,
    setActiveBomTab,
    isComponentEnabled,
    toggleComponent,
    handleSave,
  } = useQuoteConfig(currentConfig);

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
            <TabsTrigger value="bom">BOM联动</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 py-4">
            <GeneralSettingsTab
              mode={mode}
              onModeChange={setMode}
              defaultPlan={defaultPlan}
              onDefaultPlanChange={setDefaultPlan}
              selectedFields={selectedFields}
              onFieldToggle={handleFieldToggle}
            />
          </TabsContent>

          <TabsContent value="calculation" className="space-y-4 py-4">
            <CalculationSettingsTab
              curtainLoss={curtainLoss}
              onCurtainLossChange={setCurtainLoss}
              wallpaperLoss={wallpaperLoss}
              onWallpaperLossChange={setWallpaperLoss}
            />
          </TabsContent>

          <TabsContent value="bom" className="py-4">
            <BomSettingsTab
              activeBomTab={activeBomTab}
              onTabChange={setActiveBomTab}
              isComponentEnabled={isComponentEnabled}
              onToggleComponent={toggleComponent}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={() => handleSave(() => setOpen(false))}>保存全部配置</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
