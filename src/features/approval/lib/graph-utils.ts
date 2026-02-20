import { ApprovalNode, ApprovalEdge } from '../schema';

interface FlatNode {
    id: string; // temporary graph id
    name: string;
    approverType: 'ROLE' | 'USER' | 'CREATOR_MANAGER' | null;
    approverValue: string | null;
    approverMode: 'ANY' | 'ALL' | 'MAJORITY';
    conditions: Condition[];
    sortOrder: number;
}

// 条件对象接口
interface Condition {
    field: string;
    operator: string;
    value: string | number | boolean | string[];
}

// 节点 data 字段接口
interface NodeData {
    isStart?: boolean;
    label?: string;
    approverType?: 'ROLE' | 'USER' | 'CREATOR_MANAGER';
    approverValue?: string;
    approverMode?: 'ANY' | 'ALL' | 'MAJORITY';
    condition?: string;
}

/**
 * 将可视化审批图（节点和边）展平为线性执行的审批节点序列。
 * 
 * 转换策略：
 * 1. 查找起点节点 (Start Node)
 * 2. 通过 BFS (广度优先搜索) 遍历图的边
 * 3. 处理条件节点 (Condition Node)，将条件附加到链路后续的审批节点上
 * 4. 按层级生成线性 sortOrder，确保基础的拓扑执行顺序
 * 
 * *注意：此为简化版本，适用于典型的线性或简单分支审批流，复杂并发分支可能需要高级调度引擎。*
 * 
 * @param nodes - ReactFlow 格式的节点数组
 * @param edges - ReactFlow 格式的边数组
 * @returns 扁平化、包含执行顺序和规则条件的审批节点数组
 * @throws 当检测到异常循环或超长链路（>500次迭代）时抛出错误
 */
export function flattenApprovalGraph(nodes: ApprovalNode[], edges: ApprovalEdge[]): FlatNode[] {
    const nodeData = (n: ApprovalNode): NodeData => (n.data || {}) as NodeData;
    const startNode = nodes.find(n => n.type === 'start' || nodeData(n).isStart);
    if (!startNode) return [];

    const flatNodes: FlatNode[] = [];
    const visited = new Set<string>();
    let currentLevel = 0;

    const MAX_ITERATIONS = 500;
    let iterations = 0;

    // Queue for BFS: { nodeId, inheritedConditions, level }
    let queue: { id: string; conditions: Condition[]; level: number }[] = [
        { id: startNode.id, conditions: [], level: 1 }
    ];

    while (queue.length > 0) {
        if (++iterations > MAX_ITERATIONS) {
            throw new Error('审批流程图遍历超过最大限制，请检查是否存在循环引用');
        }

        // Sort queue by level to ensure approximate topological order handling
        queue = queue.toSorted((a, b) => a.level - b.level);
        const current = queue.shift()!;

        if (visited.has(current.id)) continue;
        visited.add(current.id);

        const node = nodes.find(n => n.id === current.id);
        if (!node) continue;

        let nextConditions = [...current.conditions];
        let nextLevel = current.level;

        // Process Node
        if (node.type === 'approver') {
            const data = nodeData(node);
            flatNodes.push({
                id: node.id,
                name: data.label || '审批节点',
                approverType: data.approverType || 'USER',
                approverValue: data.approverValue || null,
                approverMode: data.approverMode || 'ANY',
                conditions: current.conditions, // Apply accumulated conditions
                sortOrder: currentLevel + 1 // Simple increment for now
            });
            nextConditions = []; // Reset conditions after consuming them? 
            // Depends on if conditions apply to *path* or just *next step*. 
            // Usually path, but for linear execution engine, we attach to node.
            currentLevel++;
            nextLevel = currentLevel + 1;
        } else if (node.type === 'condition') {
            // Condition value is usually distinct per edge (e.g. Yes/No), 
            // but simplified here: The node itself defines a condition expression.
            // We assume the condition applies to the "True" path.
            // Real implementation needs edge labels.
            // For MVP: assume node.data.condition is the condition string
            if (node.data?.condition) {
                const match = node.data.condition.match(/^\s*(\w+)\s*([><=!]+)\s*(.+)\s*$/);
                if (match) {
                    nextConditions.push({
                        field: match[1],
                        operator: convertOperator(match[2]),
                        value: match[3].trim()
                    });
                }
            }
        }

        // Find outgoing edges
        const outgoingEdges = edges.filter(e => e.source === current.id);

        for (const edge of outgoingEdges) {
            // Check edge label for branching (Yes/No) logic if needed
            // For now, propagate
            queue.push({
                id: edge.target,
                conditions: nextConditions,
                level: nextLevel
            });
        }
    }

    return flatNodes.toSorted((a, b) => a.sortOrder - b.sortOrder);
}

function convertOperator(op: string): string {
    const map: Record<string, string> = {
        '>': 'gt',
        '<': 'lt',
        '=': 'eq',
        '==': 'eq',
        '!=': 'ne',
        '>=': 'gte',
        '<=': 'lte'
    };
    return map[op] || 'eq';
}
