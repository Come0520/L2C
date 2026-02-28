'use client';

import { useEffect, useState } from 'react';
import { getActivities, ActivityDTO } from '@/features/customers/actions/activities';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';

interface Props {
  customerId: string;
  refreshTrigger?: number;
}

/** 跟踪方式映射表 */
const TYPE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> =
  {
    VISIT: { label: '上门拜访', variant: 'default' },
    CALL: { label: '电话沟通', variant: 'secondary' },
    WECHAT: { label: '微信沟通', variant: 'outline' },
    OTHER: { label: '其他', variant: 'outline' },
  };

/**
 * 跟进记录表格
 *
 * 以表格形式展示客户的跟进记录，包含：时间、跟踪人、跟踪方式、跟踪内容
 */
export function ActivityTimeline({ customerId, refreshTrigger }: Props) {
  const [activities, setActivities] = useState<ActivityDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      const res = await getActivities(customerId);
      if (res.success && res.data) {
        setActivities(res.data);
      }
      setLoading(false);
    }
    fetchActivities();
  }, [customerId, refreshTrigger]);

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return <div className="text-muted-foreground py-8 text-center text-sm">暂无跟进记录</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[160px]">时间</TableHead>
            <TableHead className="w-[100px]">跟踪人</TableHead>
            <TableHead className="w-[100px]">跟踪方式</TableHead>
            <TableHead>跟踪内容</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => {
            const typeInfo = TYPE_LABELS[activity.type] || TYPE_LABELS.OTHER;
            return (
              <TableRow key={activity.id}>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                  {format(new Date(activity.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </TableCell>
                <TableCell className="text-sm">{activity.creator.name}</TableCell>
                <TableCell>
                  <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                </TableCell>
                <TableCell className="text-foreground/80 max-w-[300px] text-sm">
                  <span className="line-clamp-2">{activity.description}</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
