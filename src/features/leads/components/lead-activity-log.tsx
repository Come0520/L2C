import { getLeadTimeline } from '../actions';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { formatDate } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { cn } from '@/shared/lib/utils';

interface LeadActivityLogProps {
    leadId: string;
}

export async function LeadActivityLog({ leadId }: LeadActivityLogProps) {
    const activities = await getLeadTimeline({ leadId });

    return (
        <Card>
            <CardHeader title="跟进记录" className="border-b pb-4 mb-4" />
            <CardContent>
                <div className="space-y-6">
                    {activities.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-4">暂无跟进记录</div>
                    ) : (
                        activities.map((activity, index) => (
                            <div key={activity.id} className="relative pl-6 pb-6 last:pb-0 border-l border-border last:border-0 ml-2">
                                {/* Dot */}
                                <div className={cn(
                                    "absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border border-background",
                                    activity.activityType === 'SYSTEM' ? "bg-muted" : "bg-primary"
                                )} />

                                <div className="flex flex-col space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium text-foreground">
                                            {activity.creator?.name || '系统'}
                                            <span className="text-muted-foreground font-normal ml-2">
                                                {activity.activityType === 'PHONE_CALL' && '拨打了电话'}
                                                {activity.activityType === 'WECHAT_CHAT' && '微信沟通'}
                                                {activity.activityType === 'STORE_VISIT' && '客户到店'}
                                                {activity.activityType === 'HOME_VISIT' && '上门拜访'}
                                                {activity.activityType === 'QUOTE_SENT' && '发送报价'}
                                                {activity.activityType === 'SYSTEM' && '系统操作'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatDate(new Date(activity.createdAt as any))}
                                        </div>
                                    </div>
                                    <div className="text-sm text-foreground bg-muted/10 p-2 rounded-md">
                                        {activity.content}
                                    </div>
                                    {activity.nextFollowupDate && (
                                        <div className="text-xs text-orange-500 mt-1">
                                            下次跟进: {formatDate(new Date(activity.nextFollowupDate as any))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
