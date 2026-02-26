'use client';

import { useTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { toast } from 'sonner';
import { toggleFinanceMode } from '../actions/simple-mode-actions';

interface ModeSwitcherProps {
    initialMode: 'simple' | 'professional';
}

export function FinanceModeSwitcher({ initialMode }: ModeSwitcherProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [actualMode, setActualMode] = useState<'simple' | 'professional'>(initialMode);

    useEffect(() => {
        setActualMode(initialMode);
    }, [initialMode]);

    const onCheckedChange = (checked: boolean) => {
        const targetMode = checked ? 'professional' : 'simple';

        if (targetMode === 'simple') {
            if (!confirm('注意：切换到简易模式后，当前界面的凭证、科目都将被屏蔽，新发生的收支仅以“收入/支出”方式记录。\n\n您确定要切换吗？')) {
                return;
            }
        }

        startTransition(async () => {
            try {
                const res = await toggleFinanceMode(targetMode);
                if (res.error) {
                    toast.error(res.error);
                } else {
                    setActualMode(targetMode);
                    toast.success(`已切换至${targetMode === 'simple' ? '极简收支' : '专业会计'}模式`);

                    if (targetMode === 'simple') {
                        router.push('/finance/simple');
                    } else {
                        router.push('/finance/ledger');
                    }
                }
            } catch (error) {
                toast.error('模式切换操作失败');
            }
        });
    };

    return (
        <div className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
            <Label htmlFor="finance-mode" className="text-sm font-semibold text-yellow-800">
                专业模式
            </Label>
            <Switch
                id="finance-mode"
                disabled={isPending}
                checked={actualMode === 'professional'}
                onCheckedChange={onCheckedChange}
                className="data-[state=checked]:bg-yellow-600"
            />
            <span className="text-xs text-yellow-600 block pl-2">
                {actualMode === 'professional' ? '当前使用复式记账(适型企业)' : '当前使用一笔账(适型个体)'}
            </span>
        </div>
    );
}
