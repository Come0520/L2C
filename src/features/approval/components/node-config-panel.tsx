'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { ApprovalNode } from '../schema';

/**
 * 节点配置面板属性
 */
interface NodeConfigPanelProps {
    /** 当前选中的节点对象 */
    selectedNode: ApprovalNode | null;
    /** 选定节点数据更新时的回调函数 */
    onUpdate: (id: string, data: Partial<ApprovalNode['data']>) => void;
    /** 关闭配置面板的回调函数 */
    onClose: () => void;
}

/**
 * 节点配置面板组件
 * 用于编辑审批流程中各个节点的详细属性，如审批人类型、审批方式或条件表达式
 */
export function NodeConfigPanel({ selectedNode, onUpdate, onClose }: NodeConfigPanelProps) {
    if (!selectedNode) return null;

    const isApprover = selectedNode.type === 'approver';
    const isCondition = selectedNode.type === 'condition';

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate(selectedNode.id, { label: e.target.value });
    };

    const handleApproverTypeChange = (value: string) => {
        onUpdate(selectedNode.id, { approverType: value as 'USER' | 'ROLE' | 'CREATOR_MANAGER' });
    };

    const handleApproverValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate(selectedNode.id, { approverValue: e.target.value });
    };

    return (
        <Card className="w-[300px] border-l rounded-none h-full absolute right-0 top-0 z-10 bg-background/95 backdrop-blur shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-sm font-medium">节点配置</CardTitle>
                <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>节点名称</Label>
                    <Input
                        value={selectedNode.data.label}
                        onChange={handleLabelChange}
                    />
                </div>

                {isApprover && (
                    <>
                        <div className="space-y-2">
                            <Label>审批人类型</Label>
                            <Select
                                value={selectedNode.data.approverType || 'USER'}
                                onValueChange={handleApproverTypeChange}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">指定用户</SelectItem>
                                    <SelectItem value="ROLE">指定角色</SelectItem>
                                    <SelectItem value="CREATOR_MANAGER">发起人主管</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>用户ID/角色ID</Label>
                            <Input
                                value={selectedNode.data.approverValue || ''}
                                onChange={handleApproverValueChange}
                                placeholder="输入ID..."
                            />
                        </div>

                        {(selectedNode.data.approverType === 'ROLE' || selectedNode.data.approverType === 'USER') && (
                            <div className="space-y-2">
                                <Label>审批方式</Label>
                                <Select
                                    value={selectedNode.data.approverMode || 'ANY'}
                                    onValueChange={(val) => onUpdate(selectedNode.id, { approverMode: val as 'ANY' | 'ALL' | 'MAJORITY' })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ANY">或签 (任一通过)</SelectItem>
                                        <SelectItem value="ALL">会签 (所有通过)</SelectItem>
                                        <SelectItem value="MAJORITY">多数签 (超半数通过)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </>
                )}

                {isCondition && (
                    <div className="space-y-2">
                        <Label>条件表达式</Label>
                        <Input
                            value={selectedNode.data.condition || ''}
                            onChange={(e) => onUpdate(selectedNode.id, { condition: e.target.value })}
                            placeholder="e.g. amount > 5000"
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
