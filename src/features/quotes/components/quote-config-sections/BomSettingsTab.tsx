'use client';

import { Switch } from '@/shared/ui/switch';
import { BOM_PRESETS } from '../../constants/quote-config';

interface BomSettingsTabProps {
  /** 当前激活的主材 Tab */
  activeBomTab: string;
  /** Tab 切换回调 */
  onTabChange: (tab: string) => void;
  /** 检查某组件是否已启用 */
  isComponentEnabled: (mainCat: string, targetCat: string) => boolean;
  /** 切换组件启用状态 */
  onToggleComponent: (mainCat: string, targetCat: string, defaultCalcLogic: string) => void;
}

/**
 * BOM 联动 Tab 面板
 *
 * @description 按主材类别展示配套组件开关，控制添加主材时自动带出哪些附件。
 */
export function BomSettingsTab({
  activeBomTab,
  onTabChange,
  isComponentEnabled,
  onToggleComponent,
}: BomSettingsTabProps) {
  const currentPreset = BOM_PRESETS.find((p) => p.value === activeBomTab);

  return (
    <div className="max-h-[450px] space-y-3 overflow-y-auto pr-2">
      <p className="text-muted-foreground text-sm">
        选择主材类别，通过开关控制添加该商品时自动带出哪些配套组件。全部关闭则不启用 BOM。
      </p>

      {/* 主材类别 Tab 按钮栏 */}
      <div className="flex flex-wrap gap-1.5 border-b pb-2">
        {BOM_PRESETS.map((preset) => {
          const enabledCount = preset.components.filter((c) =>
            isComponentEnabled(preset.value, c.targetCategory)
          ).length;
          const isActive = activeBomTab === preset.value;

          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => onTabChange(preset.value)}
              className={`rounded-md border px-3 py-1.5 text-xs transition-all ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground font-medium shadow-sm'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {preset.label}
              {enabledCount > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted-foreground/15 text-muted-foreground'
                  }`}
                >
                  {enabledCount}/{preset.components.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 当前类别下的组件开关列表 */}
      {currentPreset && (
        <div className="space-y-2">
          <h4 className="text-foreground text-sm font-medium">
            添加「{currentPreset.label}」时自动带出：
          </h4>
          {currentPreset.components.map((comp) => {
            const enabled = isComponentEnabled(currentPreset.value, comp.targetCategory);
            return (
              <div
                key={comp.targetCategory}
                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                  enabled ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border'
                }`}
              >
                <div className="space-y-0.5">
                  <span
                    className={`text-sm font-medium ${
                      enabled ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {comp.label}
                  </span>
                  <p className="text-muted-foreground text-xs">{comp.description}</p>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={() =>
                    onToggleComponent(
                      currentPreset.value,
                      comp.targetCategory,
                      comp.defaultCalcLogic
                    )
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
