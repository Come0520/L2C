import { vi } from 'vitest';

export function createMockQuery() {
    return {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
    };
}

export function createMockInsert() {
    return vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
        }),
    });
}

export function createMockUpdate() {
    return vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
            returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
        }),
    });
}

export function createMockDelete() {
    return vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
        returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
    });
}

export function createMockSelect() {
    return vi.fn().mockImplementation(() => {
        const chain = {
            from: vi.fn().mockReturnThis(),
            leftJoin: vi.fn().mockReturnThis(),
            rightJoin: vi.fn().mockReturnThis(),
            innerJoin: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            and: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            groupBy: vi.fn().mockReturnThis(),
            having: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            offset: vi.fn().mockReturnThis(),
            execute: vi.fn().mockResolvedValue([{ count: 0 }]),
            then: vi.fn().mockImplementation((onFulfilled) => {
                return Promise.resolve([]).then(onFulfilled);
            }),
        };
        return chain;
    });
}

export function createMockTransaction(tables: string[]) {
    const query: Record<string, ReturnType<typeof createMockQuery>> = {};
    tables.forEach(table => {
        query[table] = createMockQuery();
    });

    return {
        query,
        insert: createMockInsert(),
        update: createMockUpdate(),
        delete: createMockDelete(),
        select: createMockSelect(),
    };
}

export function createMockDb(tables: string[]) {
    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        return callback(createMockTransaction(tables));
    });

    const query: Record<string, ReturnType<typeof createMockQuery>> = {};
    tables.forEach(table => {
        query[table] = createMockQuery();
    });

    return {
        query,
        insert: createMockInsert(),
        update: createMockUpdate(),
        delete: createMockDelete(),
        select: createMockSelect(),
        transaction: mockTransaction,
    };
}
