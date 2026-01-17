import { z } from 'zod';
export const zodI18nMap = (issue: z.ZodIssue, ctx: any) => { return { message: ctx.defaultError }; };
// @ts-ignore
z.setErrorMap(zodI18nMap);
