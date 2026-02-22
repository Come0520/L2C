import { logger } from "@/shared/lib/logger";
import { db } from "@/shared/api/db";
import { measureTasks, quotes } from "@/shared/api/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { eq, desc, and } from "drizzle-orm";
import { format } from "date-fns";
import { Badge } from "@/shared/ui/badge";
import Link from "next/link";
import { Ruler, FileText, Calendar, User, ArrowRight } from "lucide-react";

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
            where: and(
                eq(measureTasks.leadId, leadId),
                eq(measureTasks.tenantId, tenantId)
            ),
            orderBy: [desc(measureTasks.createdAt)],
            with: {
                assignedWorker: true,
            },
            limit: 5
        });
    } catch (error) {
        logger.error('[LeadRelatedCards] Error fetching measurements:', error);
        // 继续执行，仅显示空状态
    }

    // 2. Fetch Quotes
    try {
        leadQuotes = await db.query.quotes.findMany({
            where: and(
                eq(quotes.leadId, leadId),
                eq(quotes.tenantId, tenantId)
            ),
            orderBy: [desc(quotes.createdAt)],
            with: {
                creator: true,
            },
            limit: 5
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
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        测量服务
                    </CardTitle>
                    {/* Add Button could go here */}
                </CardHeader>
                <CardContent>
                    {measurements.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm bg-muted/50 rounded-md border border-dashed">
                            暂无测量任务
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {measurements.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{task.measureNo}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {task.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {task.scheduledAt ? format(task.scheduledAt, "yyyy-MM-dd HH:mm") : "未排期"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {task.assignedWorker?.name || "未分配"}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Link to measurement details (Assuming route exists or placeholder) */}
                                    <Link href={`/measurements/${task.id}`} className="p-2 hover:bg-primary/10 rounded-full transition-colors">
                                        <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-primary" />
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
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        报价单记录
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {leadQuotes.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm bg-muted/50 rounded-md border border-dashed">
                            暂无报价单
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {leadQuotes.map(quote => (
                                <div key={quote.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{quote.quoteNo}</span>
                                            <Badge variant={quote.isActive ? "default" : "secondary"} className="text-xs">
                                                {quote.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground px-1 bg-muted rounded">v{quote.version}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>
                                                金额: <span className="font-medium text-foreground">¥{quote.finalAmount}</span>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {quote.creator?.name || "未知"}
                                            </span>
                                        </div>
                                    </div>
                                    <Link href={`/quotes/${quote.id}`} className="p-2 hover:bg-primary/10 rounded-full transition-colors">
                                        <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-primary" />
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
