
import { describe, it, expect } from 'vitest';
import { flattenApprovalGraph } from '../lib/graph-utils';
import { ApprovalNode, ApprovalEdge } from '../schema';

describe('Graph Utils - flattenApprovalGraph', () => {
    it('should return empty array if no start node', () => {
        const nodes: ApprovalNode[] = [
            { id: '1', type: 'approver', position: { x: 0, y: 0 }, data: { label: 'Node 1' } }
        ];
        const edges: ApprovalEdge[] = [];
        const result = flattenApprovalGraph(nodes, edges);
        expect(result).toEqual([]);
    });

    it('should flatten a simple linear graph', () => {
        const nodes: ApprovalNode[] = [
            { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start', isStart: true } as any },
            {
                id: 'node1',
                type: 'approver',
                position: { x: 100, y: 0 },
                data: { label: 'Approver 1', approverType: 'USER', approverValue: 'u1' }
            }
        ];
        const edges: ApprovalEdge[] = [
            { id: 'e1', source: 'start', target: 'node1', type: 'default' }
        ];

        const result = flattenApprovalGraph(nodes, edges);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('node1');
        expect(result[0].name).toBe('Approver 1');
        expect(result[0].sortOrder).toBe(1);
    });

    it('should handle condition nodes and attach conditions to next approver', () => {
        const nodes: ApprovalNode[] = [
            { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start', isStart: true } as any },
            {
                id: 'cond1',
                type: 'condition',
                position: { x: 100, y: 0 },
                data: { label: 'Cond 1', condition: 'amount > 1000' }
            },
            {
                id: 'node2',
                type: 'approver',
                position: { x: 200, y: 0 },
                data: { label: 'Manager', approverType: 'ROLE', approverValue: 'MANAGER' }
            }
        ];
        const edges: ApprovalEdge[] = [
            { id: 'e1', source: 'start', target: 'cond1', type: 'default' },
            { id: 'e2', source: 'cond1', target: 'node2', type: 'default' }
        ];

        const result = flattenApprovalGraph(nodes, edges);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('node2');
        expect(result[0].conditions).toHaveLength(1);
        expect(result[0].conditions[0]).toEqual({
            field: 'amount',
            operator: 'gt',
            value: '1000'
        });
    });

    it('should handle cycles gracefully by ignoring back-edges', () => {
        // Create a simple loop: Start -> Node1 -> Node2 -> Node1
        const nodes: ApprovalNode[] = [
            { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start', isStart: true } as any },
            { id: 'node1', type: 'approver', position: { x: 100, y: 0 }, data: { label: 'N1' } },
            { id: 'node2', type: 'approver', position: { x: 200, y: 0 }, data: { label: 'N2' } }
        ];
        const edges: ApprovalEdge[] = [
            { id: 'e1', source: 'start', target: 'node1', type: 'default' },
            { id: 'e2', source: 'node1', target: 'node2', type: 'default' },
            { id: 'e3', source: 'node2', target: 'node1', type: 'default' }
        ];

        // Should not throw, but cut the cycle
        const result = flattenApprovalGraph(nodes, edges);
        expect(result).toHaveLength(2); // node1, node2
        expect(result.map(n => n.id)).toEqual(['node1', 'node2']);
    });

    it('should parse various operators correctly', () => {
        const nodes: ApprovalNode[] = [
            { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start', isStart: true } as any },
            { id: 'c1', type: 'condition', position: { x: 50, y: 0 }, data: { label: 'C1', condition: 'a == 1' } },
            { id: 'c2', type: 'condition', position: { x: 100, y: 0 }, data: { label: 'C2', condition: 'b >= 2' } },
            { id: 'c3', type: 'condition', position: { x: 150, y: 0 }, data: { label: 'C3', condition: 'c != 3' } },
            { id: 'n1', type: 'approver', position: { x: 200, y: 0 }, data: { label: 'Final' } }
        ];
        const edges: ApprovalEdge[] = [
            { id: 'e1', source: 'start', target: 'c1', type: 'default' },
            { id: 'e2', source: 'c1', target: 'c2', type: 'default' },
            { id: 'e3', source: 'c2', target: 'c3', type: 'default' },
            { id: 'e4', source: 'c3', target: 'n1', type: 'default' }
        ];

        const result = flattenApprovalGraph(nodes, edges);
        const conditions = result[0].conditions;

        expect(conditions).toEqual([
            { field: 'a', operator: 'eq', value: '1' },
            { field: 'b', operator: 'gte', value: '2' },
            { field: 'c', operator: 'ne', value: '3' }
        ]);
    });
});
