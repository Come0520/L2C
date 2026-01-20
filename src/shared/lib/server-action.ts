import { z } from 'zod';
import { auth } from './auth';
import { type Session } from 'next-auth';

export type ActionState<TOutput> = {
    data?: TOutput;
    error?: string;
    success?: boolean;
};

export const createSafeAction = <TInput, TOutput>(
    schema: z.Schema<TInput>,
    handler: (validatedData: TInput, context: { session: Session }) => Promise<TOutput>
) => {
    return async (rawData: TInput): Promise<ActionState<TOutput>> => {
        try {
            const session = await auth();
            if (!session) {
                return { error: '未授权访问', success: false };
            }

            const result = schema.safeParse(rawData);
            if (!result.success) {
                return { error: '输入验证失败', success: false };
            }

            const data = await handler(result.data, { session });
            return { data, success: true };
        } catch (error: unknown) {
            console.error('[Action Error]', error);
            const message = error instanceof Error ? error.message : '操作失败';
            return { error: message, success: false };
        }
    };
};
