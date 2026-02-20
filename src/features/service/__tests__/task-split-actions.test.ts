import { describe, it, expect, beforeEach, vi } from 'vitest';
import { suggestTaskSplit, updateWorkerSkills, getAvailableWorkers, getWorkerSkills } from '../actions/task-split-actions';

const {
    mockUserId,
    mockTenantId,
    mockQuoteItemsExecute,
    mockWorkerSkillsExecute,
    mockDeleteWhere,
    mockInsertValues
} = vi.hoisted(() => {
    return {
        mockUserId: 'user-id-dispatcher',
        mockTenantId: 'tenant-id-123',
        mockQuoteItemsExecute: vi.fn(),
        mockWorkerSkillsExecute: vi.fn(),
        mockDeleteWhere: vi.fn(),
        mockInsertValues: vi.fn(),
    };
});

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockImplementation(() => ({
        user: { id: mockUserId, tenantId: mockTenantId }
    }))
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            quoteItems: { findMany: mockQuoteItemsExecute },
            workerSkills: { findMany: mockWorkerSkillsExecute }
        },
        delete: vi.fn(() => ({
            where: mockDeleteWhere
        })),
        insert: vi.fn(() => ({
            values: mockInsertValues
        }))
    }
}));

vi.mock('next/cache', () => ({
    unstable_cache: (cb: any) => cb
}));

describe('Service Feature - Task Split Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('suggestTaskSplit', () => {
        it('should return empty data if no items found', async () => {
            mockQuoteItemsExecute.mockResolvedValueOnce([]);

            const result = await suggestTaskSplit('quote-123');

            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
            expect(mockWorkerSkillsExecute).not.toHaveBeenCalled();
        });

        it('should correctly map categories to skills and return suggestions', async () => {
            const mockItems = [
                { id: '1', product: { category: 'CURTAIN' } },
                { id: '2', product: { category: 'WALLPAPER' } }, // Expect mapping to WALLCLOTH skill
                { id: '3', product: { category: 'UNKNOWN_CAT' } } // Expect OTHER
            ];
            mockQuoteItemsExecute.mockResolvedValueOnce(mockItems);

            // Mock worker skills to simulate finding matching workers
            mockWorkerSkillsExecute.mockResolvedValueOnce([{ workerId: 'w1' }]); // For CURTAIN
            mockWorkerSkillsExecute.mockResolvedValueOnce([{ workerId: 'w2' }, { workerId: 'w3' }]); // For WALLCLOTH (from WALLPAPER)
            mockWorkerSkillsExecute.mockResolvedValueOnce([]); // For OTHER

            const result = await suggestTaskSplit('quote-123');

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(3);

            // Check CURTAIN mapping
            const curtainSuggestion = result.data?.find(s => s.category === 'CURTAIN');
            expect(curtainSuggestion).toBeDefined();
            expect(curtainSuggestion?.itemCount).toBe(1);
            expect(curtainSuggestion?.recommendedSkill).toBe('INSTALL_CURTAIN');
            expect(curtainSuggestion?.matchingWorkerCount).toBe(1);

            // Check WALLPAPER to WALLCLOTH mapping
            const wallclothSuggestion = result.data?.find(s => s.category === 'WALLCLOTH');
            expect(wallclothSuggestion).toBeDefined();
            expect(wallclothSuggestion?.itemCount).toBe(1);
            expect(wallclothSuggestion?.recommendedSkill).toBe('INSTALL_WALLCLOTH');
            expect(wallclothSuggestion?.matchingWorkerCount).toBe(2);

            // Check UNKNOWN_CAT to OTHER
            const otherSuggestion = result.data?.find(s => s.category === 'OTHER');
            expect(otherSuggestion).toBeDefined();
            expect(otherSuggestion?.itemCount).toBe(1);
        });
    });

    describe('updateWorkerSkills', () => {
        it('should execute delete and batch insert correctly', async () => {
            mockDeleteWhere.mockResolvedValueOnce([]);
            mockInsertValues.mockResolvedValueOnce([]);

            const result = await updateWorkerSkills('worker-123', ['INSTALL_CURTAIN', 'INSTALL_WALLCLOTH']);

            expect(result.success).toBe(true);
            expect(mockDeleteWhere).toHaveBeenCalled(); // Should clear old skills
            expect(mockInsertValues).toHaveBeenCalledWith([
                { tenantId: mockTenantId, workerId: 'worker-123', skillType: 'INSTALL_CURTAIN' },
                { tenantId: mockTenantId, workerId: 'worker-123', skillType: 'INSTALL_WALLCLOTH' }
            ]);
        });
    });

    describe('getWorkerSkills', () => {
        it('should retrieve worker skills mapping correctly', async () => {
            mockWorkerSkillsExecute.mockResolvedValueOnce([
                { skillType: 'INSTALL_CURTAIN' },
                { skillType: 'INSTALL_WALLPANEL' }
            ]);

            const result = await getWorkerSkills('worker-123');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(['INSTALL_CURTAIN', 'INSTALL_WALLPANEL']);
        });
    });

    describe('getAvailableWorkers', () => {
        it('should retrieve workers list matching the specific skill', async () => {
            mockWorkerSkillsExecute.mockResolvedValueOnce([
                { workerId: 'w1', worker: { name: 'Worker One' } },
                { workerId: 'w2', worker: null }
            ]);

            const result = await getAvailableWorkers('INSTALL_CURTAIN');

            expect(result.success).toBe(true);
            expect(result.data).toEqual([
                { id: 'w1', name: 'Worker One' },
                { id: 'w2', name: null }
            ]);
        });
    });
});
