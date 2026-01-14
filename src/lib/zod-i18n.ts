import { z } from 'zod';
export const zodI18nMap = (issue: z.ZodIssue, ctx: z.ZodErrorMapContext) => { return { message: ctx.defaultError }; };
z.setErrorMap(zodI18nMap);
