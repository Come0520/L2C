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
    value: string;
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
 * Convert Visual Graph (Nodes + Edges) into a linear sequence of Approval Nodes.
 * Note: This simplified version flattens the graph. 
 * Complex parallel branches might share sortOrder or need advanced logic.
 * 
 * Strategy:
 * 1. Find Start Node.
 * 2. Traverse edges.
 * 3. Handle Condition Nodes by attaching conditions to subsequent Approver Nodes.
 */
export function flattenApprovalGraph(nodes: ApprovalNode[], edges: ApprovalEdge[]): FlatNode[] {
    const nodeData = (n: ApprovalNode): NodeData => (n.data || {}) as NodeData;
    const startNode = nodes.find(n => n.type === 'start' || nodeData(n).isStart);
    if (!startNode) return [];

    const flatNodes: FlatNode[] = [];
    const visited = new Set<string>();
    let currentLevel = 0;

    // Queue for BFS: { nodeId, inheritedConditions, level }
    let queue: { id: string; conditions: Condition[]; level: number }[] = [
        { id: startNode.id, conditions: [], level: 1 }
    ];

    while (queue.length > 0) {
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
                // Parse condition string "amount > 5000" -> object
                // This parser is primitive
                const parts = node.data.condition.split(' ');
                if (parts.length >= 3) {
                    nextConditions.push({
                        field: parts[0],
                        operator: convertOperator(parts[1]),
                        value: parts[2]
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
