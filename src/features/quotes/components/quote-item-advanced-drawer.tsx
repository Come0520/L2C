'use client';

import { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/shared/ui/drawer';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { updateQuoteItem } from '@/features/quotes/actions/quote-item-crud';
import { toast } from 'sonner';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';

import { QuoteItem as SharedQuoteItem } from '@/shared/api/schema/quotes';
import { QuoteItem as UIQuoteItem } from './quote-items-table/types';
import { logger } from '@/shared/lib/logger';

interface QuoteItemAdvancedDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // 兼容 UI 流转的 local QuoteItem 和 DB 层 SharedQuoteItem
  item: UIQuoteItem | SharedQuoteItem | null;
  onSuccess?: () => void;
}

interface QuoteItemAdvancedAttributes {
  installPosition?: string;
  groundClearance?: number | string;
  openingStyle?: string;
  fabricWidth?: number | string;
  formula?: string;
  headerType?: string;
  sideLoss?: number | string;
  bottomLoss?: number | string;
  headerLoss?: number | string;
  rollLength?: number | string;
  patternRepeat?: number | string;
  customPanels?: { width: number }[];
  [key: string]: unknown;
}

export function QuoteItemAdvancedDrawer({
  open,
  onOpenChange,
  item,
  onSuccess,
}: QuoteItemAdvancedDrawerProps) {
  const [loading, setLoading] = useState(false);

  /**
   * 报价项的动态属性集
   */
  const [attributes, setAttributes] = useState<QuoteItemAdvancedAttributes>({});

  const [processFee, setProcessFee] = useState<number>(0);
  const [foldRatio, setFoldRatio] = useState<number>(2);
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (item && open) {
      setAttributes(item.attributes || {});
      setProcessFee(Number(item.processFee || 0));
      setFoldRatio(Number(item.foldRatio || 2));
      setRemark(item.remark || '');
    }
  }, [item, open]);

  if (!item) return null;

  const isCurtain = ['CURTAIN', 'CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(item.category);
  const isWallpaper = ['WALLPAPER', 'WALLCLOTH'].includes(item.category);

  const handleSave = async () => {
    setLoading(true);
    try {
      const processedAttributes: Record<string, string | number | boolean | null | { width: number }[]> = {};
      Object.keys(attributes).forEach((key) => {
        const val = attributes[key];
        if (val !== undefined && val !== null) {
          // 数组类型属性（如 customPanels）直接保留，不做 String() 转换
          if (Array.isArray(val)) {
            processedAttributes[key] = val;
          } else {
            processedAttributes[key] = String(val);
          }
        }
      });
      // 将可能会产生 undefined 的字段转为 null
      processedAttributes.fabricWidth = attributes.fabricWidth ? Number(attributes.fabricWidth) : null;
      processedAttributes.sideLoss = attributes.sideLoss !== undefined && attributes.sideLoss !== '' ? Number(attributes.sideLoss) : null;
      processedAttributes.bottomLoss = attributes.bottomLoss !== undefined && attributes.bottomLoss !== '' ? Number(attributes.bottomLoss) : null;
      processedAttributes.headerLoss = attributes.headerLoss !== undefined && attributes.headerLoss !== '' ? Number(attributes.headerLoss) : null;
      processedAttributes.rollLength = attributes.rollLength ? Number(attributes.rollLength) : null;
      processedAttributes.patternRepeat = attributes.patternRepeat !== undefined && attributes.patternRepeat !== '' ? Number(attributes.patternRepeat) : null;

      // 清理原先的 undefined 避免 ts 报错
      Object.keys(processedAttributes).forEach(key => {
        if (processedAttributes[key] === undefined) {
          delete processedAttributes[key];
        }
      });

      await updateQuoteItem({
        id: item.id,
        processFee,
        foldRatio: isCurtain ? foldRatio : undefined,
        remark,
        attributes: processedAttributes as Record<
          string,
          string | number | boolean | (string | number | boolean | null)[] | null
        >,
      });
      toast.success('高级配置已保存');
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('保存失败');
      logger.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateAttribute = (key: string, value: unknown) => {
    setAttributes((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle>高级配置: {item.productName}</DrawerTitle>
            <DrawerDescription>调整计算参数和详细配置</DrawerDescription>
          </DrawerHeader>

          <ScrollArea className="h-[50vh] px-4">
            <div className="space-y-6 py-4">
              {/* 通用配置 */}
              <div className="space-y-4">
                <h4 className="text-sm leading-none font-medium">基础参数</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>加工费 (Process Fee)</Label>
                    <Input
                      type="number"
                      value={processFee}
                      onChange={(e) => setProcessFee(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>备注 (Remark)</Label>
                    <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 窗帘特定配置 */}
              {/* 窗帘特定配置 */}
              {isCurtain && (
                <div className="space-y-4">
                  <h4 className="text-sm leading-none font-medium">窗帘算法参数</h4>

                  {/* 新增：安装与尺寸修正 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>安装位置 (Install Position)</Label>
                      <Select
                        value={attributes.installPosition || 'CURTAIN_BOX'}
                        onValueChange={(v) => updateAttribute('installPosition', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CURTAIN_BOX">窗帘盒 (Default)</SelectItem>
                          <SelectItem value="INSIDE">窗框内 (Inside)</SelectItem>
                          <SelectItem value="OUTSIDE">窗框外 (Outside)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>离地高度 (Ground Clearance)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={
                            attributes.groundClearance !== undefined
                              ? attributes.groundClearance
                              : 2
                          }
                          onChange={(e) => updateAttribute('groundClearance', e.target.value)}
                        />
                        <span className="text-muted-foreground absolute top-2.5 right-3 text-xs">
                          cm
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>拉动形式</Label>
                      <Select
                        value={attributes.openingStyle || 'SPLIT'}
                        onValueChange={(v) => {
                          updateAttribute('openingStyle', v);
                          // 选择"自定义"时，初始化默认 2 片（各取一半宽度）
                          if (v === 'CUSTOM' && (!attributes.customPanels || !Array.isArray(attributes.customPanels) || (attributes.customPanels as { width: number }[]).length === 0)) {
                            const halfWidth = Math.round(Number(item.width || 0) * 100 / 2); // m→cm 再除2
                            updateAttribute('customPanels', [{ width: halfWidth }, { width: halfWidth }]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择形式" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SPLIT">对开</SelectItem>
                          <SelectItem value="SINGLE_LEFT">单开左</SelectItem>
                          <SelectItem value="SINGLE_RIGHT">单开右</SelectItem>
                          <SelectItem value="CUSTOM">自定义片数</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>褶皱倍数</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={foldRatio}
                        onChange={(e) => setFoldRatio(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* 自定义片数编辑器 */}
                  {attributes.openingStyle === 'CUSTOM' && (() => {
                    const panels = Array.isArray(attributes.customPanels)
                      ? (attributes.customPanels as { width: number }[])
                      : [{ width: 0 }, { width: 0 }];

                    const updatePanel = (index: number, width: number) => {
                      const newPanels = [...panels];
                      newPanels[index] = { width };
                      updateAttribute('customPanels', newPanels);
                    };
                    const addPanel = () => {
                      updateAttribute('customPanels', [...panels, { width: 0 }]);
                    };
                    const removePanel = (index: number) => {
                      if (panels.length <= 1) return;
                      const newPanels = panels.filter((_, i) => i !== index);
                      updateAttribute('customPanels', newPanels);
                    };

                    return (
                      <div className="space-y-2 rounded-lg border border-dashed p-3">
                        <Label className="text-xs text-muted-foreground">各片宽度 (cm)，高度和褶皱倍数共用</Label>
                        <div className="space-y-2">
                          {panels.map((panel, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-14 shrink-0">第{index + 1}片</span>
                              <Input
                                type="number"
                                className="h-8 flex-1"
                                value={panel.width || ''}
                                onChange={(e) => updatePanel(index, Number(e.target.value))}
                                placeholder="宽度"
                              />
                              <span className="text-xs text-muted-foreground">cm</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removePanel(index)}
                                disabled={panels.length <= 1}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-7 text-xs"
                          onClick={addPanel}
                        >
                          + 添加一片
                        </Button>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>幅宽 (Fabric Width)</Label>
                      <Input
                        type="number"
                        value={attributes.fabricWidth || ''}
                        onChange={(e) => updateAttribute('fabricWidth', e.target.value)}
                        placeholder="280"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>算料公式 (Formula)</Label>
                      <Select
                        value={attributes.formula || 'FIXED_HEIGHT'}
                        onValueChange={(v) => updateAttribute('formula', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select formula" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIXED_HEIGHT">定高 (Fixed Height)</SelectItem>
                          <SelectItem value="FIXED_WIDTH">定宽 (Fixed Width)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>帘头工艺 (Header)</Label>
                    <Select
                      value={attributes.headerType || 'WRAPPED'}
                      onValueChange={(v) => updateAttribute('headerType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WRAPPED">包布带 (Wrapped)</SelectItem>
                        <SelectItem value="ATTACHED">贴布带 (Attached)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>边损 (Side)</Label>
                      <Input
                        type="number"
                        value={attributes.sideLoss || ''}
                        onChange={(e) => updateAttribute('sideLoss', e.target.value)}
                        placeholder="Default"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>底边 (Bottom)</Label>
                      <Input
                        type="number"
                        value={attributes.bottomLoss || ''}
                        onChange={(e) => updateAttribute('bottomLoss', e.target.value)}
                        placeholder="Default"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>帘头损耗 (Head)</Label>
                      <Input
                        type="number"
                        value={attributes.headerLoss || ''}
                        onChange={(e) => updateAttribute('headerLoss', e.target.value)}
                        placeholder="Default"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 墙纸特定配置 */}
              {isWallpaper && (
                <div className="space-y-4">
                  <h4 className="text-sm leading-none font-medium">墙纸/墙布参数</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>每卷长度 (Roll Length)</Label>
                      <Input
                        type="number"
                        value={attributes.rollLength || ''}
                        onChange={(e) => updateAttribute('rollLength', e.target.value)}
                        placeholder="1000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>对花损耗 (Repeat)</Label>
                      <Input
                        type="number"
                        value={attributes.patternRepeat || ''}
                        onChange={(e) => updateAttribute('patternRepeat', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 调试信息 (仅开发可见) */}
              {/* <div className="text-xs text-muted-foreground pt-4 bg-muted/20 p-2 rounded">
                                <p>Category: {item.category}</p>
                                <pre>{JSON.stringify(attributes, null, 2)}</pre>
                            </div> */}
            </div>
          </ScrollArea>

          <DrawerFooter>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? '保存中...' : '保存更改'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">取消</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
