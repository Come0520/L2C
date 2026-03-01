'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { ApprovalFlowDesigner } from '@/features/approval/components/approval-flow-designer';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface ApprovalFlow {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean | null;
  updatedAt: Date | null;
  definition: unknown | null;
}

/**
 * 审批流配置组件属性
 */
interface ApprovalSettingsContentProps {
  /** 初始加载的审批流列表数据 */
  initialFlows: ApprovalFlow[];
}

/**
 * 审批流配置管理内容组件
 * 提供审批流的列表展示、状态切换以及进入设计器进行可视化编辑的入口
 */
export function ApprovalSettingsContent({ initialFlows }: ApprovalSettingsContentProps) {
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [flows] = useState<ApprovalFlow[]>(initialFlows);

  const selectedFlow = flows.find((f) => f.id === selectedFlowId);

  if (selectedFlowId && selectedFlow) {
    // Designer View
    return (
      <div className="flex h-[calc(100vh-200px)] flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedFlowId(null)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> 返回列表
            </Button>
            <div className="flex flex-col">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                {selectedFlow.name}
                <Badge variant={selectedFlow.isActive ? 'default' : 'secondary'}>
                  {selectedFlow.isActive ? '已启用' : '未启用'}
                </Badge>
              </h2>
              <p className="text-muted-foreground text-sm">{selectedFlow.code}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex-1">
          <ApprovalFlowDesigner
            flowId={selectedFlow.id}
            initialData={
              selectedFlow.definition as {
                nodes: import('@xyflow/react').Node[];
                edges: import('@xyflow/react').Edge[];
              }
            }
          />
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {flows.map((flow) => (
        <Card
          key={flow.id}
          className={cn(
            'hover:border-primary cursor-pointer transition-colors',
            'border shadow-sm'
          )}
          onClick={() => setSelectedFlowId(flow.id)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base font-medium">{flow.name}</CardTitle>
              <Badge variant={flow.isActive ? 'outline' : 'secondary'} className="text-xs">
                {flow.isActive ? '启用' : '禁用'}
              </Badge>
            </div>
            <CardDescription className="font-mono text-xs">{flow.code}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {flow.description || '无描述'}
            </p>
            <div className="text-muted-foreground mt-4 text-xs">
              更新于: {flow.updatedAt ? new Date(flow.updatedAt).toLocaleDateString() : 'N/A'}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
