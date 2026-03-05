'use client';

import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface CurtainLoss {
  side: number;
  bottom: number;
  header: number;
}

interface WallpaperLoss {
  width: number;
  cut: number;
}

interface CalculationSettingsTabProps {
  /** 窗帘损耗参数 */
  curtainLoss: CurtainLoss;
  /** 窗帘损耗更新回调 */
  onCurtainLossChange: (loss: CurtainLoss) => void;
  /** 墙纸损耗参数 */
  wallpaperLoss: WallpaperLoss;
  /** 墙纸损耗更新回调 */
  onWallpaperLossChange: (loss: WallpaperLoss) => void;
}

/**
 * 计算参数 Tab 面板
 *
 * @description 包含窗帘和墙纸/墙布的预设损耗参数输入配置。
 */
export function CalculationSettingsTab({
  curtainLoss,
  onCurtainLossChange,
  wallpaperLoss,
  onWallpaperLossChange,
}: CalculationSettingsTabProps) {
  return (
    <div className="grid gap-6">
      <p className="text-muted-foreground text-sm">设定默认的损耗参数，用于自动计算用量。</p>

      {/* 窗帘损耗 */}
      <div className="space-y-3">
        <h4 className="border-b pb-1 text-sm font-medium">窗帘损耗 (cm)</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="curtain-side" className="text-xs">
              单边损耗
            </Label>
            <Input
              id="curtain-side"
              type="number"
              value={curtainLoss.side}
              onChange={(e) =>
                onCurtainLossChange({ ...curtainLoss, side: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="curtain-bottom" className="text-xs">
              底边损耗
            </Label>
            <Input
              id="curtain-bottom"
              type="number"
              value={curtainLoss.bottom}
              onChange={(e) =>
                onCurtainLossChange({ ...curtainLoss, bottom: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="curtain-header" className="text-xs">
              帘头损耗
            </Label>
            <Input
              id="curtain-header"
              type="number"
              value={curtainLoss.header}
              onChange={(e) =>
                onCurtainLossChange({ ...curtainLoss, header: Number(e.target.value) })
              }
            />
          </div>
        </div>
      </div>

      {/* 墙纸/墙布损耗 */}
      <div className="space-y-3">
        <h4 className="border-b pb-1 text-sm font-medium">墙纸/墙布损耗 (cm)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wp-width" className="text-xs">
              宽度损耗
            </Label>
            <Input
              id="wp-width"
              type="number"
              value={wallpaperLoss.width}
              onChange={(e) =>
                onWallpaperLossChange({ ...wallpaperLoss, width: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wp-cut" className="text-xs">
              裁剪损耗
            </Label>
            <Input
              id="wp-cut"
              type="number"
              value={wallpaperLoss.cut}
              onChange={(e) =>
                onWallpaperLossChange({ ...wallpaperLoss, cut: Number(e.target.value) })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
