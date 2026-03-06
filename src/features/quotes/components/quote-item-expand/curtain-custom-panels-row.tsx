import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { ExpandRowSharedProps } from './types';

export function CurtainCustomPanelsRow({
    readOnly,
    middleCols,
    customPanels,
    updatePanel,
    handleAutoSave,
    addPanel,
    removePanel,
}: ExpandRowSharedProps) {
    return (
        <tr className="group/advanced border-border/50 relative border-b border-dashed bg-slate-50/40 dark:bg-slate-900/40">
            <td colSpan={middleCols} className="border-border/50 border-x p-4 align-top">
                <div className="space-y-3 rounded-lg border border-dashed bg-[var(--background)] p-4">
                    <Label className="text-muted-foreground text-xs font-semibold">
                        各片宽度 (cm)，高度和褶皱倍数共用
                    </Label>
                    <div className="grid grid-cols-4 gap-4">
                        {customPanels.map((panel, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 rounded-md border bg-white p-2 shadow-sm dark:bg-slate-950"
                            >
                                <span className="w-10 shrink-0 text-xs font-medium text-slate-500">
                                    第{index + 1}片
                                </span>
                                <Input
                                    type="number"
                                    className="h-8 flex-1 border-none px-1 text-sm shadow-none focus-visible:ring-0"
                                    value={panel.width || ''}
                                    onChange={(e) => updatePanel(index, Number(e.target.value))}
                                    onBlur={() => handleAutoSave()}
                                    placeholder="宽度"
                                    disabled={readOnly}
                                />
                                <span className="text-muted-foreground text-xs">cm</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-destructive h-6 w-6 shrink-0 p-0"
                                    onClick={() => removePanel(index)}
                                    disabled={customPanels.length <= 1 || readOnly}
                                >
                                    ×
                                </Button>
                            </div>
                        ))}
                        {!readOnly && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-muted-foreground hover:text-primary h-full min-h-[42px] border-dashed text-xs"
                                onClick={addPanel}
                            >
                                + 添加一片
                            </Button>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
}
