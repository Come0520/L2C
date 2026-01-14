import { z } from 'zod';

export const workflowConfigSchema = z.object({
    quoteCreationMode: z.enum(['REQUIRE_LEAD', 'REQUIRE_MEASURE', 'FLEXIBLE']),
    measurementTrigger: z.enum(['FROM_LEAD', 'FROM_QUOTE', 'BOTH']),
    allowDirectOrderWithoutMeasure: z.boolean(),
});

export type WorkflowConfig = z.infer<typeof workflowConfigSchema>;

export const updateWorkflowConfigSchema = z.object({
    config: workflowConfigSchema,
});
