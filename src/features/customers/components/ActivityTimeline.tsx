'use client';

import { useEffect, useState } from 'react';
import { getActivities, ActivityDTO } from '@/features/customers/actions/activities';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Loader2, Phone, MessageSquare, MapPin, User, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

interface Props {
    customerId: string;
    refreshTrigger?: number; // Prop to trigger refresh
}

export function ActivityTimeline({ customerId, refreshTrigger }: Props) {
    const [activities, setActivities] = useState<ActivityDTO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, [customerId, refreshTrigger]);

    async function fetchActivities() {
        setLoading(true);
        const res = await getActivities(customerId);
        if (res.success && res.data) {
            setActivities(res.data);
        }
        setLoading(false);
    }

    if (loading && activities.length === 0) {
        return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    if (activities.length === 0) {
        return <div className="text-center text-muted-foreground py-8 text-sm">暂无跟进记录</div>;
    }

    return (
        <div className="space-y-8 pl-2">
            {activities.map((activity, index) => (
                <div key={activity.id} className="relative flex gap-4">
                    {/* Line */}
                    {index !== activities.length - 1 && (
                        <div className="absolute left-[19px] top-10 bottom-[-32px] w-[2px] bg-muted/50" />
                    )}

                    {/* Icon */}
                    <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm
            ${activity.type === 'VISIT' ? 'border-blue-200 bg-blue-50 text-blue-600' :
                            activity.type === 'CALL' ? 'border-green-200 bg-green-50 text-green-600' :
                                activity.type === 'WECHAT' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' :
                                    'border-gray-200 bg-gray-50 text-gray-600'
                        }`}>
                        {activity.type === 'VISIT' && <MapPin className="h-4 w-4" />}
                        {activity.type === 'CALL' && <Phone className="h-4 w-4" />}
                        {activity.type === 'WECHAT' && <MessageSquare className="h-4 w-4" />}
                        {activity.type === 'OTHER' && <CheckCircle2 className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 space-y-1 pt-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">
                                    {activity.type === 'VISIT' ? '上门拜访' :
                                        activity.type === 'CALL' ? '电话沟通' :
                                            activity.type === 'WECHAT' ? '微信沟通' : '其他跟进'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(activity.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                                </span>
                            </div>
                        </div>

                        <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 p-3 rounded-lg border border-transparent hover:border-border transition-colors">
                            {activity.description}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={activity.creator.avatarUrl || undefined} />
                                    <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                                </Avatar>
                                <span>{activity.creator.name}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
