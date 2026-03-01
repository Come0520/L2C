import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import { measureTasks, quotes } from '@/shared/api/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { eq, desc, and } from 'drizzle-orm';
import { format } from 'date-fns';
import { Badge } from '@/shared/ui/badge';
import Link from 'next/link';
import Ruler from 'lucide-react/dist/esm/icons/ruler';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import User from 'lucide-react/dist/esm/icons/user';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

interface LeadRelatedCardsProps {
  leadId: string;
  tenantId: string;
}

interface MeasurementTask {
  id: string;
  measureNo: string;
  status: string | null;
  scheduledAt: Date | null;
  assignedWorker: { name: string | null } | null;
}

interface LeadQuote {
  id: string;
  quoteNo: string;
  status: string | null;
  isActive: boolean | null;
  version: number | null;
  finalAmount: string | number | null;
  creator: { name: string | null } | null;
}

export async function LeadRelatedCards({ leadId, tenantId }: LeadRelatedCardsProps) {
  let measurements: MeasurementTask[] = [];
  let leadQuotes: LeadQuote[] = [];

  // 1. Fetch Measurements
  try {
    measurements = await db.query.measureTasks.findMany({
      where: and(eq(measureTasks.leadId, leadId), eq(measureTasks.tenantId, tenantId)),
      orderBy: [desc(measureTasks.createdAt)],
      with: {
        assignedWorker: true,
      },
      limit: 5,
    });
  } catch (error) {
    logger.error('[LeadRelatedCards] Error fetching measurements:', error);
    // 继续执行，仅显示空状态
  }

  // 2. Fetch Quotes
  try {
    leadQuotes = await db.query.quotes.findMany({
      where: and(eq(quotes.leadId, leadId), eq(quotes.tenantId, tenantId)),
      orderBy: [desc(quotes.createdAt)],
      with: {
        creator: true,
      },
      limit: 5,
    });
  } catch (error) {
    logger.error('[LeadRelatedCards] Error fetching quotes:', error);
    // 继续执行，仅显示空状态
  }

  return (
    <div className="space-y-6">
      {/* Measurement Service Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Ruler className="text-muted-foreground h-4 w-4" />
            测量服务
          </CardTitle>
          {/* Add Button could go here */}
        </CardHeader>
        <CardContent>
          {measurements.length === 0 ? (
            <div className="text-muted-foreground bg-muted/50 rounded-md border border-dashed py-6 text-center text-sm">
              暂无测量任务
            </div>
          ) : (
            <div className="space-y-4">
              {measurements.map((task) => (
                <div
                  key={task.id}
                  className="bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{task.measureNo}</span>
                      <Badge variant="outline" className="text-xs">
                        {task.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {task.scheduledAt ? format(task.scheduledAt, 'yyyy-MM-dd HH:mm') : '未排期'}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.assignedWorker?.name || '未分配'}
                      </span>
                    </div>
                  </div>
                  {/* 测量详情链接 */}
                  <Link
                    href={`/measurements/${task.id}`}
                    className="hover:bg-primary/10 rounded-full p-2 transition-colors"
                  >
                    <ArrowRight className="text-muted-foreground hover:text-primary h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quote Records Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <FileText className="text-muted-foreground h-4 w-4" />
            报价单记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leadQuotes.length === 0 ? (
            <div className="text-muted-foreground bg-muted/50 rounded-md border border-dashed py-6 text-center text-sm">
              暂无报价单
            </div>
          ) : (
            <div className="space-y-4">
              {leadQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{quote.quoteNo}</span>
                      <Badge variant={quote.isActive ? 'default' : 'secondary'} className="text-xs">
                        {quote.status}
                      </Badge>
                      <span className="text-muted-foreground bg-muted rounded px-1 text-xs">
                        v{quote.version}
                      </span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-4 text-xs">
                      <span>
                        金额:{' '}
                        <span className="text-foreground font-medium">¥{quote.finalAmount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {quote.creator?.name || '未知'}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/quotes/${quote.id}`}
                    className="hover:bg-primary/10 rounded-full p-2 transition-colors"
                  >
                    <ArrowRight className="text-muted-foreground hover:text-primary h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
