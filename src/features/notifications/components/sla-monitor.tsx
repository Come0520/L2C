'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { runSLACheckAction } from '../actions';
import { toast } from 'sonner';
import { Loader2, BellRing, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useSession } from 'next-auth/react';

interface SLACheckResult {
    type: string;
    found: number;
    sent: number;
}

export function SLAMonitor() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [lastResult, setLastResult] = useState<SLACheckResult[] | null>(null);
    const [lastRunAt, setLastRunAt] = useState<Date | null>(null);

    const isAdminOrManager = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER';

    const handleRunCheck = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const res = await runSLACheckAction({});
            if (res?.success) {
                toast.success('SLA Check Completed');
                setLastResult(res.data as SLACheckResult[]);
                setLastRunAt(new Date());
            } else {
                toast.error('SLA Check Failed');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAdminOrManager) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">SLA Monitor</CardTitle>
                <BellRing className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Manually trigger SLA checks for Lead Follow-up and Measure Dispatch.
                </p>

                <Button onClick={handleRunCheck} disabled={isLoading} variant="outline" className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Run SLA Check Now
                </Button>

                {lastResult && lastResult.length > 0 ? (
                    <div className="mt-4 p-4 rounded-md bg-muted/50 text-sm space-y-2 border">
                        {lastResult.map((r, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                                <span className="font-medium text-slate-700 dark:text-slate-300">{r.type}</span>
                                <span className={cn(
                                    "font-mono font-bold",
                                    r.found > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"
                                )}>
                                    Found: {r.found} / Sent: {r.sent}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : lastResult && (
                    <div className="mt-4 flex items-center justify-center p-3 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-md border border-emerald-100 dark:border-emerald-900">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        All systems nominal
                    </div>
                )}

                {lastRunAt && (
                    <p className="text-[10px] text-muted-foreground mt-2 text-right">
                        Last run: {lastRunAt.toLocaleTimeString()}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
