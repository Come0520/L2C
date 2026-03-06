import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { INSTALL_POSITIONS } from '@/features/quotes/constants/quote-item';
import { ExpandRowSharedProps } from './types';

export function CurtainBaseParamsRow({
    readOnly,
    extraCols,
    editedAttrs,
    updateAttr,
    updateAttrAndSave,
    handleAutoSave,
    updateOpeningStyleAndSave,
}: ExpandRowSharedProps) {
    return (
        <tr className="group/advanced border-border/50 relative border-b border-dashed bg-slate-50/40 shadow-inner dark:bg-slate-900/40">
            {/* Param 1: 幅宽 */}
            <td className="border-border/50 border-l p-3 align-top">
                <div className="w-full space-y-1.5 pr-4">
                    <Label className="text-muted-foreground text-xs font-semibold">幅宽</Label>
                    <div className="relative">
                        <Input
                            type="number"
                            onFocus={(e) => e.target.select()}
                            value={editedAttrs.fabricWidth || ''}
                            onChange={(e) => updateAttr('fabricWidth', e.target.value)}
                            onBlur={() => handleAutoSave()}
                            placeholder="280"
                            className="h-8 w-full pr-8 text-sm"
                            disabled={readOnly}
                        />
                        <span className="text-muted-foreground absolute top-2 right-2 text-xs">cm</span>
                    </div>
                </div>
            </td>

            {/* Param 2: 拉动方式 */}
            <td className="p-3 align-top">
                <div className="w-full space-y-1.5 pr-4">
                    <Label className="text-muted-foreground text-xs font-semibold">拉动方式</Label>
                    <Select
                        value={editedAttrs.openingStyle || 'SPLIT'}
                        onValueChange={updateOpeningStyleAndSave}
                        disabled={readOnly}
                    >
                        <SelectTrigger className="h-8 w-full text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="SPLIT">对开</SelectItem>
                            <SelectItem value="SINGLE_LEFT">左单开</SelectItem>
                            <SelectItem value="SINGLE_RIGHT">右单开</SelectItem>
                            <SelectItem value="CUSTOM">自定义选项</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </td>

            {/* Param 3: 安装位置 */}
            <td className="p-3 align-top">
                <div className="w-full space-y-1.5 pr-4">
                    <Label className="text-muted-foreground text-xs font-semibold">安装位置</Label>
                    <Select
                        value={editedAttrs.installPosition || 'CURTAIN_BOX'}
                        onValueChange={(v) => updateAttrAndSave('installPosition', v)}
                        disabled={readOnly}
                    >
                        <SelectTrigger className="h-8 w-full text-sm">
                            <SelectValue />
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
            </td>

            {/* Param 4: 离地高度 */}
            <td className="border-border/50 border-r p-3 align-top">
                <div className="w-full space-y-1.5 pr-4">
                    <Label className="text-muted-foreground text-xs font-semibold">离地高度</Label>
                    <div className="relative">
                        <Input
                            type="number"
                            onFocus={(e) => e.target.select()}
                            value={editedAttrs.groundClearance ?? 2}
                            onChange={(e) => updateAttr('groundClearance', e.target.value)}
                            onBlur={() => handleAutoSave()}
                            className="h-8 w-full pr-8 text-sm"
                            disabled={readOnly}
                        />
                        <span className="text-muted-foreground absolute top-2 right-2 text-xs">cm</span>
                    </div>
                </div>
            </td>

            {extraCols > 0 &&
                Array.from({ length: extraCols }).map((_, i) => (
                    <td key={`extra-1-${i}`} className="border-border/50 border-r p-3"></td>
                ))}
        </tr>
    );
}
