import { z } from 'zod';

export const measureBriefSchema = z.object({
    id: z.string().uuid().optional(),
    orderId: z.string().uuid(),
    customerId: z.string().uuid(),
    spaces: z.array(z.object({
        name: z.string(),
        measurements: z.array(z.object({
            label: z.string(),
            value: z.number(),
            unit: z.string()
        }))
    }))
});

export type MeasureBrief = z.infer<typeof measureBriefSchema>;
