/**
 * 安全 Action Hook
 * 提供类型安全的 Server Action 执行封装
 */

/**
 * Server Action 的返回类型
 */
type ActionResult<TData> = {
    data?: TData;
    error?: string;
    success?: boolean;
};

/**
 * Server Action 的类型定义
 */
type ServerAction<TInput, TOutput> = (input: TInput) => Promise<ActionResult<TOutput>>;

/**
 * 创建安全的 Action 执行器
 * @param action - 要执行的 Server Action
 * @returns 包含 execute 方法和状态的对象
 */
export const useSafeAction = <TInput, TOutput>(
    action: ServerAction<TInput, TOutput>
) => {
    return {
        execute: async (data: TInput): Promise<ActionResult<TOutput>> => {
            return action(data);
        },
        status: 'idle' as const
    };
};
