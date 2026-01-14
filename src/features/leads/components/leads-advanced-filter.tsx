'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Filter } from 'lucide-react';
import { Label } from '@/shared/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ChannelPicker } from '@/features/channels/components/channel-picker';

interface LeadsAdvancedFilterProps {
    tenantId: string;
}

export function LeadsAdvancedFilter({ tenantId }: LeadsAdvancedFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);

    // Local state for filter values
    const [intentionLevel, setIntentionLevel] = useState(searchParams.get('intentionLevel') || 'ALL');
    const [channelId, setChannelId] = useState(searchParams.get('channelId') || '');

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (intentionLevel && intentionLevel !== 'ALL') {
            params.set('intentionLevel', intentionLevel);
        } else {
            params.delete('intentionLevel');
        }

        if (channelId) {
            params.set('channelId', channelId);
        } else {
            params.delete('channelId');
        }

        params.set('page', '1');
        router.push(`?${params.toString()}`);
        setOpen(false);
    };

    const handleReset = () => {
        setIntentionLevel('ALL');
        setChannelId('');
        const params = new URLSearchParams(searchParams.toString());
        params.delete('intentionLevel');
        params.delete('channelId');
        router.push(`?${params.toString()}`);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    高级筛选
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>高级筛选</DialogTitle>
                    <DialogDescription>
                        多维度筛选线索数据
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>意向等级</Label>
                        <Select value={intentionLevel} onValueChange={setIntentionLevel}>
                            <SelectTrigger>
                                <SelectValue placeholder="全部" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">全部</SelectItem>
                                <SelectItem value="HIGH">高意向</SelectItem>
                                <SelectItem value="MEDIUM">中意向</SelectItem>
                                <SelectItem value="LOW">低意向</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>来源渠道</Label>
                        <ChannelPicker
                            tenantId={tenantId}
                            value={channelId}
                            onChange={setChannelId}
                            placeholder="选择渠道"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <div className="flex w-full justify-between">
                        <Button variant="ghost" onClick={handleReset}>重置</Button>
                        <Button onClick={handleApply}>应用筛选</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
