import { vi } from 'vitest';

export function createMockQuery() {
    return {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
    };
}

export function createMockInsert() {
    // 创建可链式调用的完整 insert mock
    // 支持: insert().values().returning()
    // 支持: insert().values().onConflictDoUpdate(...).returning()
    // 支持: insert().values().onConflictDoNothing().returning()
    const chain = {
        values: vi.fn(),
        onConflictDoUpdate: vi.fn(),
        onConflictDoNothing: vi.fn(),
        returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
        execute: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
    };
    // 链式调用：每个方法返回 chain 本身
    chain.values.mockReturnValue(chain);
    chain.onConflictDoUpdate.mockReturnValue(chain);
    chain.onConflictDoNothing.mockReturnValue(chain);

    return vi.fn().mockReturnValue(chain);
}

export function createMockUpdate() {
    // 创建可链式调用的完整 update mock
    // 支持: update().set().where().returning()
    // 支持: update().set().where()（async resolve）
    const chain = {
        set: vi.fn(),
        where: vi.fn(),
        returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
        execute: vi.fn().mockResolvedValue([]),
    };
    // where 本身作为 promise（支持 await db.update().set().where()）
    chain.where.mockReturnValue({
        ...chain,
        then: (onFulfilled: (v: unknown) => unknown) =>
            Promise.resolve([{ id: 'mock-id' }]).then(onFulfilled),
    });
    chain.set.mockReturnValue(chain);

    return vi.fn().mockReturnValue(chain);
}

export function createMockDelete() {
    const chain = {
        where: vi.fn(),
        returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
        execute: vi.fn().mockResolvedValue([]),
    };
    chain.where.mockReturnValue(chain);

    return vi.fn().mockReturnValue(chain);
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
            catch: vi.fn().mockImplementation((onRejected) => {
                return Promise.resolve([]).catch(onRejected);
            }),
            finally: vi.fn().mockImplementation((onFinally) => {
                return Promise.resolve([]).finally(onFinally);
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
        execute: vi.fn().mockResolvedValue([]),
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
        execute: vi.fn().mockResolvedValue([]),
    };
}
