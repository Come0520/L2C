'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Plus, X, ArrowDown, Settings2 } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { roles } from "@/shared/api/schema";

export type Role = typeof roles.$inferSelect;

// Types
export interface ApprovalNode {
    id?: string;
    flowId?: string;
    name: string;
    type: 'role' | 'specific_user';
    targetId: string; // Role Code or User ID
    stepIndex: number;
    condition?: string;
}

export interface ApprovalFlow {
    id?: string;
    name: string;
    code: string;
    description?: string;
    nodes: ApprovalNode[];
}

interface ApprovalFlowDesignerProps {
    initialFlow?: ApprovalFlow;
    roles: Role[]; // Available roles for selection
    onSave: (flow: ApprovalFlow) => Promise<void>;
}

// Node Form Schema
const nodeSchema = z.object({
    name: z.string().min(1, '节点名称必填'),
    type: z.enum(['role', 'specific_user']),
    targetId: z.string().min(1, '必须选择审批�?角色'),
    condition: z.string().optional(),
});

type NodeFormValues = z.infer<typeof nodeSchema>;

export function ApprovalFlowDesigner({ initialFlow, roles, onSave }: ApprovalFlowDesignerProps) {
    const [nodes, setNodes] = useState<ApprovalNode[]>(initialFlow?.nodes || []);
    const [flowMetadata, setFlowMetadata] = useState({
        name: initialFlow?.name || '',
        code: initialFlow?.code || '',
        description: initialFlow?.description || '',
    });
    const [editingNodeIndex, setEditingNodeIndex] = useState<number | null>(null);
    const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);

    // Form for Node Editing
    const { register, handleSubmit, setValue, reset, formState: { errors }, control } = useForm<NodeFormValues>({
        resolver: zodResolver(nodeSchema),
        defaultValues: { type: 'role' }
    });

    // Use useWatch instead of watch() to avoid React Compiler warnings
    const formType = useWatch({ control, name: 'type' });
    const formTargetId = useWatch({ control, name: 'targetId' });

    const handleAddNode = () => {
        setEditingNodeIndex(null);
        reset({ type: 'role', name: `审批节点 ${nodes.length + 1}` });
        setIsNodeDialogOpen(true);
    };

    const handleEditNode = (index: number) => {
        setEditingNodeIndex(index);
        const node = nodes[index];
        reset({
            name: node.name,
            type: node.type,
            targetId: node.targetId,
            condition: node.condition,
        });
        setIsNodeDialogOpen(true);
    };

    const handleDeleteNode = (index: number) => {
        const newNodes = [...nodes];
        newNodes.splice(index, 1);
        // Re-index
        newNodes.forEach((n, i) => n.stepIndex = i + 1);
        setNodes(newNodes);
    };

    const onNodeSubmit = (data: NodeFormValues) => {
        const newNode: ApprovalNode = {
            name: data.name,
            type: data.type,
            targetId: data.targetId,
            condition: data.condition,
            stepIndex: editingNodeIndex !== null ? nodes[editingNodeIndex].stepIndex : nodes.length + 1,
        };

        if (editingNodeIndex !== null) {
            const newNodes = [...nodes];
            newNodes[editingNodeIndex] = { ...newNodes[editingNodeIndex], ...newNode };
            setNodes(newNodes);
        } else {
            setNodes([...nodes, newNode]);
        }
        setIsNodeDialogOpen(false);
    };

    const handleSaveFlow = async () => {
        if (!flowMetadata.name || !flowMetadata.code) {
            // Basic validation
            // Use toast or visual feedback
            return;
        }
        await onSave({
            ...initialFlow,
            name: flowMetadata.name,
            code: flowMetadata.code,
            description: flowMetadata.description,
            nodes: nodes.map((n, i) => ({ ...n, stepIndex: i + 1 })),
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>基础信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>流程名称</Label>
                            <Input
                                value={flowMetadata.name}
                                onChange={(e) => setFlowMetadata({ ...flowMetadata, name: e.target.value })}
                                placeholder="�? 特价审批流程"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>流程代码 (Code)</Label>
                            <Input
                                value={flowMetadata.code}
                                onChange={(e) => setFlowMetadata({ ...flowMetadata, code: e.target.value })}
                                placeholder="�? DISCOUNT_APPROVAL"
                                disabled={!!initialFlow?.id}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>描述</Label>
                        <Input
                            value={flowMetadata.description}
                            onChange={(e) => setFlowMetadata({ ...flowMetadata, description: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col items-center space-y-4 relative pb-20">
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -z-10" />

                <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-medium text-sm border border-primary/20 z-10 bg-background">
                    开�?
                </div>

                <ArrowDown className="text-muted-foreground w-4 h-4" />

                {nodes.map((node, index) => (
                    <div key={index} className="flex flex-col items-center relative z-10">
                        <Card className="w-[300px] border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{node.name}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {node.type === 'role' ? '角色审批' : '指定人员'} :
                                        <Badge variant="outline" className="ml-1 text-[10px] h-5 py-0">
                                            {node.type === 'role'
                                                ? (roles.find(r => r.code === node.targetId)?.name || node.targetId)
                                                : node.targetId}
                                        </Badge>
                                    </div>
                                    {node.condition && (
                                        <div className="text-[10px] bg-yellow-50 text-yellow-700 px-1 py-0.5 mt-2 rounded border border-yellow-200 inline-block">
                                            条件: {node.condition}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditNode(index)}>
                                        <Settings2 className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteNode(index)}>
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        {index < nodes.length - 1 && (
                            <ArrowDown className="text-muted-foreground w-4 h-4 my-2" />
                        )}
                    </div>
                ))}

                <Button variant="outline" className="rounded-full z-10 bg-background" onClick={handleAddNode}>
                    <Plus className="w-4 h-4 mr-2" />
                    添加审批节点
                </Button>

                <div className="mt-8 bg-background text-muted-foreground px-4 py-2 rounded-full font-medium text-sm border z-10">
                    结束
                </div>
            </div>

            <div className="flex justify-end gap-4 border-t pt-4">
                <Button onClick={handleSaveFlow}>保存流程</Button>
            </div>

            {/* Node Edit Dialog */}
            <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingNodeIndex !== null ? '编辑节点' : '添加节点'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>节点名称</Label>
                            <Input {...register('name')} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>审批类型</Label>
                            <Select onValueChange={(v) => setValue('type', v as 'role' | 'specific_user')} defaultValue={formType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="role">指定角色</SelectItem>
                                    {/* <SelectItem value="specific_user">指定人员</SelectItem> */}
                                    {/* Simplified for now */}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>选择角色</Label>
                            <Select onValueChange={(v) => setValue('targetId', v)} defaultValue={formTargetId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择角色" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(role => (
                                        <SelectItem key={role.id} value={role.code}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.targetId && <p className="text-xs text-destructive">{errors.targetId.message}</p>}
                        </div>
                        {/* Condition input can be added here */}
                        <div className="grid justify-end">
                            <Button onClick={handleSubmit(onNodeSubmit)}>确认</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
