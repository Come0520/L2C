import { ChevronUp } from 'lucide-react';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';

import { ExpandRowSharedProps } from './types';

export function ExpandRemarkRow({
    readOnly,
    middleCols,
    editedRemark,
    setEditedRemark,
    handleAutoSave,
    onToggle,
    isCurtain,
}: ExpandRowSharedProps) {
    if (!isCurtain) {
        return (
            <tr className="group/advanced relative border-b bg-slate-50/40 last:border-b-0 dark:bg-slate-900/40">
                <td colSpan={middleCols} className="border-border/50 border-x p-4 align-top">
                    <div className="w-full space-y-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">备注</Label>
                        <Input
                            value={editedRemark}
                            onChange={(e) => setEditedRemark(e.target.value)}
                            onBlur={() => handleAutoSave({ remark: editedRemark })}
                            placeholder="请输入关于此项的特殊要求、制作说明等备注信息..."
                            className="h-8 text-sm"
                            disabled={readOnly}
                        />
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="group/advanced border-border/50 relative border-b bg-slate-50/40 last:border-b-0 dark:bg-slate-900/40">
            <td colSpan={middleCols} className="border-border/50 border-x p-0">
                <div className="p-3 px-4">
                    <div className="w-full space-y-1.5">
                        <Label className="text-muted-foreground text-xs font-semibold">备注</Label>
                        <Input
                            value={editedRemark}
                            onChange={(e) => setEditedRemark(e.target.value)}
                            onBlur={() => handleAutoSave({ remark: editedRemark })}
                            placeholder="请输入关于此项的特殊要求、制作说明等备注信息..."
                            className="h-8 text-sm"
                            disabled={readOnly}
                        />
                    </div>

                    <div className="flex justify-center pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggle}
                            className="text-muted-foreground gap-1 text-xs"
                        >
                            <ChevronUp className="h-3 w-3" />
                            收起
                        </Button>
                    </div>
                </div>
            </td>
        </tr>
    );
}
