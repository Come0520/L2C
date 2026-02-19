"use client";

import React, { useEffect, useState } from "react";
import { getSalesFunnel } from "@/features/analytics/actions";
import { SalesFunnelChart, FunnelStage } from "@/features/analytics/components/sales-funnel-chart";
import { Card, CardContent } from "@/shared/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/utils";

interface EnhancedFunnelWidgetProps {
    className?: string;
}

export function EnhancedFunnelWidget({ className }: EnhancedFunnelWidgetProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        stages: FunnelStage[];
        summary: {
            overallConversion: string;
            avgCycleTime: string;
        };
    } | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Default to last 30 days or similar, or just let action use default
                const res = await getSalesFunnel({});
                if (res?.data?.success) {
                    setData(res.data.data);
                }
            } catch (error) {
                console.error("Failed to load sales funnel data", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <Card className={cn("h-full", className)}>
                <CardContent className="flex h-full items-center justify-center p-6">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    return (
        <SalesFunnelChart
            data={data.stages}
            summary={data.summary}
            className={className}
        />
    );
}
