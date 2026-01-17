'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import { QuoteConfig } from '@/services/quote-config.service';
import { updateGlobalQuoteConfig } from '@/features/quotes/actions/config-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Settings2 } from 'lucide-react';

interface QuoteConfigDialogProps {
    currentConfig?: QuoteConfig;
}

const AVAILABLE_FIELDS = [
    { id: 'foldRatio', label: '褶皱倍数' },
    { id: 'processFee', label: '加工费' },
    { id: 'remark', label: '备注' },
    { id: 'measuredWidth', label: '实测宽' },
    { id: 'measuredHeight', label: '实测高' },
    { id: 'fabricWidth', label: '面料幅宽' },
    { id: 'installMethod', label: '安装方式 (明/暗装)' },
    { id: 'openingStyle', label: '打开方式 (单/双开)' }
];

export function QuoteConfigDialog({ currentConfig }: QuoteConfigDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [selectedFields, setSelectedFields] = useState<string[]>(currentConfig?.visibleFields || []);

    const handleToggle = (fieldId: string) => {
        setSelectedFields(prev =>
            prev.includes(fieldId)
                ? prev.filter(f => f !== fieldId)
                : [...prev, fieldId]
        );
    };

    const handleSave = async () => {
        try {
            // Assume we update tenant config for now (as admin)
            // In real world, we might split User vs Tenant config UI
            await updateGlobalQuoteConfig({ visibleFields: selectedFields });
            toast.success('配置已保存');
            setOpen(false);
            router.refresh();
        } catch {
            toast.error('保存失败');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="配置字段">
                    <Settings2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>字段显示配置</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        勾选需要在报价单中显示的字段。此设置可能影响所有租户成员。
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        {AVAILABLE_FIELDS.map((field) => (
                            <div key={field.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={field.id}
                                    checked={selectedFields.includes(field.id)}
                                    onCheckedChange={() => handleToggle(field.id)}
                                />
                                <Label htmlFor={field.id}>{field.label}</Label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                    <Button onClick={handleSave}>保存配置</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
