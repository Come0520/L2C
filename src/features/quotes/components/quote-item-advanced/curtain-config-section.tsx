import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { QuoteItemAdvancedSectionProps } from './types';
import {
    INSTALL_POSITIONS,
    FORMULA_OPTIONS,
    HEADER_TYPES,
    OPENING_STYLES,
} from '@/features/quotes/constants/quote-item';

export function CurtainConfigSection({
    attributes,
    updateAttribute,
    foldRatio,
    setFoldRatio,
    itemWidth = 0,
}: QuoteItemAdvancedSectionProps) {
    const customPanels = Array.isArray(attributes.customPanels)
        ? attributes.customPanels
        : [{ width: 0 }, { width: 0 }];

    const updatePanel = (index: number, width: number) => {
        const newPanels = [...customPanels];
        newPanels[index] = { width };
        updateAttribute('customPanels', newPanels);
    };

    const addPanel = () => {
        updateAttribute('customPanels', [...customPanels, { width: 0 }]);
    };

    const removePanel = (index: number) => {
        if (customPanels.length <= 1) return;
        const newPanels = customPanels.filter((_, i) => i !== index);
        updateAttribute('customPanels', newPanels);
    };

    return (
        <div className="space-y-4">
            <h4 className="text-sm leading-none font-medium">窗帘算法参数</h4>

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
                            {INSTALL_POSITIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>离地高度 (Ground Clearance)</Label>
                    <div className="relative">
                        <Input
                            type="number"
                            value={attributes.groundClearance !== undefined ? attributes.groundClearance : 2}
                            onChange={(e) => updateAttribute('groundClearance', e.target.value)}
                        />
                        <span className="text-muted-foreground absolute top-2.5 right-3 text-xs">cm</span>
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
                            if (
                                v === 'CUSTOM' &&
                                (!attributes.customPanels ||
                                    !Array.isArray(attributes.customPanels) ||
                                    attributes.customPanels.length === 0)
                            ) {
                                const halfWidth = Math.round((itemWidth * 100) / 2); // m→cm 再除2
                                updateAttribute('customPanels', [{ width: halfWidth }, { width: halfWidth }]);
                            }
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="选择形式" />
                        </SelectTrigger>
                        <SelectContent>
                            {OPENING_STYLES.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>褶皱倍数</Label>
                    <Input
                        type="number"
                        step="0.1"
                        value={foldRatio}
                        onChange={(e) => setFoldRatio?.(Number(e.target.value))}
                    />
                </div>
            </div>

            {attributes.openingStyle === 'CUSTOM' && (
                <div className="space-y-2 rounded-lg border border-dashed p-3">
                    <Label className="text-muted-foreground text-xs">各片宽度 (cm)，高度和褶皱倍数共用</Label>
                    <div className="space-y-2">
                        {customPanels.map((panel, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className="text-muted-foreground w-14 shrink-0 text-xs">第{index + 1}片</span>
                                <Input
                                    type="number"
                                    className="h-8 flex-1"
                                    value={panel.width || ''}
                                    onChange={(e) => updatePanel(index, Number(e.target.value))}
                                    placeholder="宽度"
                                />
                                <span className="text-muted-foreground text-xs">cm</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                                    onClick={() => removePanel(index)}
                                    disabled={customPanels.length <= 1}
                                >
                                    ×
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" className="h-7 w-full text-xs" onClick={addPanel}>
                        + 添加一片
                    </Button>
                </div>
            )}

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
                            {FORMULA_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
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
                        {HEADER_TYPES.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
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
    );
}
