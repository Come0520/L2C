import { z } from 'zod';
export const zodI18nMap = (issue: z.ZodIssue) => { return { message: issue.message }; };
// @ts-expect-error
z.setErrorMap(zodI18nMap);
