'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { ApprovalFlowDesigner } from '@/features/approval/components/approval-flow-designer';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface ApprovalFlow {
    id: string;
    name: string;
    code: string;
    description: string | null;
    isActive: boolean | null;
    updatedAt: Date | null;
    definition: unknown | null;
}

interface ApprovalSettingsContentProps {
    initialFlows: ApprovalFlow[];
}

export function ApprovalSettingsContent({ initialFlows }: ApprovalSettingsContentProps) {
    const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
    const [flows] = useState<ApprovalFlow[]>(initialFlows);

    const selectedFlow = flows.find(f => f.id === selectedFlowId);

    if (selectedFlowId && selectedFlow) {
        // Designer View
        return (
            <div className="flex flex-col h-[calc(100vh-200px)] space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedFlowId(null)}>
                            <ChevronLeft className="w-4 h-4 mr-1" /> 返回列表
                        </Button>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                {selectedFlow.name}
                                <Badge variant={selectedFlow.isActive ? 'default' : 'secondary'}>
                                    {selectedFlow.isActive ? '已启用' : '未启用'}
                                </Badge>
                            </h2>
                            <p className="text-sm text-muted-foreground">{selectedFlow.code}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 mt-4">
                    <ApprovalFlowDesigner
                        flowId={selectedFlow.id}
                        initialData={selectedFlow.definition as any}
                    />
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {flows.map(flow => (
                <Card
                    key={flow.id}
                    className={cn(
                        "cursor-pointer hover:border-primary transition-colors",
                        "border shadow-sm"
                    )}
                    onClick={() => setSelectedFlowId(flow.id)}
                >
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-medium">{flow.name}</CardTitle>
                            <Badge variant={flow.isActive ? 'outline' : 'secondary'} className="text-xs">
                                {flow.isActive ? '启用' : '禁用'}
                            </Badge>
                        </div>
                        <CardDescription className="font-mono text-xs">{flow.code}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {flow.description || '无描述'}
                        </p>
                        <div className="mt-4 text-xs text-muted-foreground">
                            更新于: {flow.updatedAt ? new Date(flow.updatedAt).toLocaleDateString() : 'N/A'}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
