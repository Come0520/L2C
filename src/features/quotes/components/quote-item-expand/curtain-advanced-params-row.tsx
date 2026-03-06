import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { FORMULA_OPTIONS, BOTTOM_TYPES, HEADER_TYPES } from '@/features/quotes/constants/quote-item';
import { ExpandRowSharedProps } from './types';

export function CurtainAdvancedParamsRow({
    readOnly,
    extraCols,
    editedAttrs,
    editedFoldRatio,
    setEditedFoldRatio,
    updateAttrAndSave,
    handleAutoSave,
}: ExpandRowSharedProps) {
    return (
        <tr className="group/advanced border-border/50 relative border-b border-dashed bg-slate-50/40 dark:bg-slate-900/40">
            {/* Param 5: 褶皱倍数 */}
            <td className="border-border/50 border-l p-3 align-top">
                <div className="w-full space-y-1.5 pr-4">
                    <Label className="text-muted-foreground text-xs font-semibold">褶皱倍数</Label>
                    <Input
                        type="number"
                        step="0.1"
                        onFocus={(e) => e.target.select()}
                        value={editedFoldRatio}
                        onChange={(e) => setEditedFoldRatio(Number(e.target.value))}
                        onBlur={() => handleAutoSave({ foldRatio: editedFoldRatio })}
                        className="h-8 w-full text-sm"
                        disabled={readOnly}
                    />
                </div>
            </td>

            {/* Param 6: 算料方式 */}
            <td className="p-3 align-top">
                <div className="w-full space-y-1.5 pr-4">
                    <Label className="text-muted-foreground text-xs font-semibold">算料方式</Label>
                    <Select
                        value={editedAttrs.formula || 'FIXED_HEIGHT'}
                        onValueChange={(v) => updateAttrAndSave('formula', v)}
                        disabled={readOnly}
                    >
                        <SelectTrigger className="h-8 w-full text-sm">
                            <SelectValue />
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
            </td>

            {/* Param 7: 底边 */}
            <td className="p-3 align-top">
                <div className="w-full space-y-1.5 pr-4">
                    <Label className="text-muted-foreground text-xs font-semibold">底边</Label>
                    <Select
                        value={editedAttrs.bottomType || 'STANDARD'}
                        onValueChange={(v) => updateAttrAndSave('bottomType', v)}
                        disabled={readOnly}
                    >
                        <SelectTrigger className="h-8 w-full text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {BOTTOM_TYPES.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </td>

            {/* Param 8: 上带方式 */}
            <td className="border-border/50 border-r p-3 align-top">
                <div className="w-full space-y-1.5 pr-4">
                    <Label className="text-muted-foreground text-xs font-semibold">上带方式</Label>
                    <Select
                        value={editedAttrs.headerType || 'WRAPPED'}
                        onValueChange={(v) => updateAttrAndSave('headerType', v)}
                        disabled={readOnly}
                    >
                        <SelectTrigger className="h-8 w-full text-sm">
                            <SelectValue />
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
            </td>

            {extraCols > 0 &&
                Array.from({ length: extraCols }).map((_, i) => (
                    <td key={`extra-2-${i}`} className="border-border/50 border-r p-3"></td>
                ))}
        </tr>
    );
}
