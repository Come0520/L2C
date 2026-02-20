"use client";

import React from "react";
import { SalesFunnelChart } from "@/features/analytics/components/sales-funnel-chart";
import { Card, CardContent } from "@/shared/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/utils";
import { createLogger } from "@/shared/lib/logger";
import useSWR from 'swr';
import { fetcher } from '@/shared/lib/fetcher';

const logger = createLogger('EnhancedFunnelWidget');

interface EnhancedFunnelWidgetProps {
    className?: string;
}

export function EnhancedFunnelWidget({ className }: EnhancedFunnelWidgetProps) {
    const { data: swrData, isLoading } = useSWR(
        '/api/workbench/sales-funnel',
        fetcher,
        {
            refreshInterval: 300000, // 5分钟刷新一次
            revalidateOnFocus: false,
            onError: (err) => {
                logger.error("Failed to load sales funnel data via SWR", {}, err);
            }
        }
    );

    const data = swrData?.success ? swrData.data : null;
    const loading = isLoading;

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
