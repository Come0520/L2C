import { getLeadTimeline } from '../actions';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { formatDate } from '@/shared/lib/utils';
import { cn } from '@/shared/lib/utils';

interface LeadActivityLogProps {
  leadId: string;
}

export async function LeadActivityLog({ leadId }: LeadActivityLogProps) {
  const activities = await getLeadTimeline({ leadId });

  return (
    <Card>
      <CardHeader title="跟进记录" className="mb-4 border-b pb-4" />
      <CardContent>
        <div className="space-y-6">
          {activities.length === 0 ? (
            <div className="text-muted-foreground py-4 text-center text-sm">暂无跟进记录</div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={activity.id}
                className="border-border relative ml-2 border-l pb-6 pl-6 last:border-0 last:pb-0"
              >
                {/* Dot */}
                <div
                  className={cn(
                    'border-background absolute top-1 -left-[5px] h-2.5 w-2.5 rounded-full border',
                    activity.activityType === 'SYSTEM' ? 'bg-muted' : 'bg-primary'
                  )}
                />

                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-foreground text-sm font-medium">
                      {activity.creator?.name || '系统'}
                      <span className="text-muted-foreground ml-2 font-normal">
                        {activity.activityType === 'PHONE_CALL' && '拨打了电话'}
                        {activity.activityType === 'WECHAT_CHAT' && '微信沟通'}
                        {activity.activityType === 'STORE_VISIT' && '客户到店'}
                        {activity.activityType === 'HOME_VISIT' && '上门拜访'}
                        {activity.activityType === 'QUOTE_SENT' && '发送报价'}
                        {activity.activityType === 'SYSTEM' && '系统操作'}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {activity.createdAt ? formatDate(new Date(String(activity.createdAt))) : '-'}
                    </div>
                  </div>
                  <div className="text-foreground bg-muted/10 rounded-md p-2 text-sm">
                    {activity.content}
                  </div>
                  {activity.nextFollowupDate && (
                    <div className="mt-1 text-xs text-orange-500">
                      下次跟进: {formatDate(new Date(String(activity.nextFollowupDate)))}
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
