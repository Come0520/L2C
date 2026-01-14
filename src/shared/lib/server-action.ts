import { z } from 'zod';
import { auth } from './auth';
import { type Session } from 'next-auth';

export type ActionState<TOutput> = {
    data?: TOutput;
    error?: string;
};

export const createSafeAction = <TInput, TOutput>(
    schema: z.Schema<TInput>,
    handler: (validatedData: TInput, context: { session: Session }) => Promise<TOutput>
) => {
    return async (rawData: TInput): Promise<ActionState<TOutput>> => {
        try {
            const session = await auth();
            if (!session) {
                return { error: '未授权访问' };
            }

            const result = schema.safeParse(rawData);
            if (!result.success) {
                return { error: '输入验证失败' };
            }

            const data = await handler(result.data, { session });
            return { data };
        } catch (error: any) {
            console.error('[Action Error]', error);
            return { error: error.message || '操作失败' };
        }
    };
};
