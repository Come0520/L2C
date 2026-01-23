'use client';

import React, { useState, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/shared/ui/button';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Save from 'lucide-react/dist/esm/icons/save';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Check from 'lucide-react/dist/esm/icons/check';
import { NodeConfigPanel } from './node-config-panel';
import { ApprovalNode } from '../schema';
import { saveFlowDefinition, publishApprovalFlow } from '../actions/flow';
import { toast } from 'sonner';

const initialNodes: Node[] = [
    {
        id: 'start',
        type: 'input',
        data: { label: '开始' },
        position: { x: 250, y: 50 },
    },
    {
        id: 'end',
        type: 'output',
        data: { label: '结束' },
        position: { x: 250, y: 500 },
    },
];

const initialEdges: Edge[] = [];

interface ApprovalFlowDesignerProps {
    flowId: string;
    initialData?: {
        nodes: Node[];
        edges: Edge[];
    };
    targetModule?: string;
    flowName?: string;
}

export function ApprovalFlowDesigner({ flowId, initialData }: ApprovalFlowDesignerProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || initialEdges);
    const [selectedNode, setSelectedNode] = useState<ApprovalNode | null>(null);
    const [isSaving, startTransition] = React.useTransition();
    const [isPublishing, startPublishTransition] = React.useTransition();

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node as ApprovalNode);
    }, []);

    const onNodeUpdate = useCallback((id: string, data: Partial<ApprovalNode['data']>) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return { ...node, data: { ...node.data, ...data } };
                }
                return node;
            })
        );
        setSelectedNode((prev) =>
            prev && prev.id === id ? { ...prev, data: { ...prev.data, ...data } } : prev
        );
    }, [setNodes]);

    const addApproverNode = () => {
        const id = `approver-${Date.now()}`;
        const newNode: Node = {
            id,
            type: 'approver',
            data: { label: '审批节点', approverType: 'USER' },
            position: { x: 250, y: 200 },
        };
        setNodes((nds: Node[]) => [...nds, newNode]);
    };

    const addConditionNode = () => {
        const id = `condition-${Date.now()}`;
        const newNode: Node = {
            id,
            type: 'condition',
            data: { label: '条件分支' },
            position: { x: 450, y: 200 },
        };
        setNodes((nds: Node[]) => [...nds, newNode]);
    };

    const handleSave = () => {
        startTransition(async () => {
            const definition = {
                nodes: nodes.map((n: Node) => ({
                    id: n.id,
                    type: n.type as any,
                    data: n.data,
                    position: n.position
                })),
                edges: edges.map((e: Edge) => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    type: e.type,
                    label: e.label
                }))
            };

            const result = await saveFlowDefinition({ flowId, definition });

            if (result?.data?.success) {
                toast.success('流程保存成功');
            } else {
                toast.error('保存失败', { description: result?.error });
            }
        });
    };

    const handlePublish = () => {
        // 先保存再发布
        startPublishTransition(async () => {
            // Re-construct definition explicitly to ensure latest state is captured
            // Note: This duplicates logic in handleSave, could be refactored
            const definition = {
                nodes: nodes.map((n: Node) => ({
                    id: n.id,
                    type: n.type as any,
                    data: n.data,
                    position: n.position
                })),
                edges: edges.map((e: Edge) => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    type: e.type,
                    label: e.label
                }))
            };

            // 1. Save
            const saveResult = await saveFlowDefinition({ flowId, definition });
            if (!saveResult?.data?.success) {
                toast.error('发布前保存失败', { description: saveResult?.error });
                return;
            }

            // 2. Publish
            const publishResult = await publishApprovalFlow({ flowId });
            if (publishResult?.data?.success) {
                toast.success('流程已发布并生效');
            } else {
                toast.error('发布失败', { description: publishResult?.error });
            }
        });
    };

    return (
        <div className="h-[800px] w-full border rounded-lg bg-background">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                fitView
            >
                <Background />
                <Controls />
                <MiniMap />
                <Panel position="top-right" className="flex gap-2">
                    <Button onClick={addApproverNode} size="sm" variant="secondary">
                        <Plus className="w-4 h-4 mr-1" /> 添加审批人
                    </Button>
                    <Button onClick={addConditionNode} size="sm" variant="secondary">
                        <Plus className="w-4 h-4 mr-1" /> 添加条件
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving || isPublishing} variant="outline">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        保存
                    </Button>
                    <Button size="sm" onClick={handlePublish} disabled={isSaving || isPublishing}>
                        {isPublishing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                        发布
                    </Button>
                </Panel>

                {selectedNode && (
                    <NodeConfigPanel
                        selectedNode={selectedNode}
                        onUpdate={onNodeUpdate}
                        onClose={() => setSelectedNode(null)}
                    />
                )}
            </ReactFlow>
        </div>
    );
}
