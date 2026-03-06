import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { QuoteItemAdvancedSectionProps } from './types';

export function GeneralConfigSection({
    processFee,
    setProcessFee,
    remark,
    setRemark,
}: Pick<QuoteItemAdvancedSectionProps, 'processFee' | 'setProcessFee' | 'remark' | 'setRemark'>) {
    return (
        <div className="space-y-4">
            <h4 className="text-sm leading-none font-medium">基础参数</h4>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>加工费 (Process Fee)</Label>
                    <Input
                        type="number"
                        value={processFee}
                        onChange={(e) => setProcessFee?.(Number(e.target.value))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>备注 (Remark)</Label>
                    <Input value={remark} onChange={(e) => setRemark?.(e.target.value)} />
                </div>
            </div>
        </div>
    );
}
