import { z } from 'zod';

export const WindowTypeEnum = z.enum(['STRAIGHT', 'L_SHAPE', 'U_SHAPE', 'BAY_WINDOW', 'CURVED']);

export const spaceMeasurementSchema = z.object({
    id: z.string().uuid().optional(),
    spaceName: z.string(),
    windowType: WindowTypeEnum,
    width: z.number().min(0),
    height: z.number().min(0),
    depth: z.number().min(0).optional(),
    attributes: z.record(z.string(), z.any()).optional()
});

export type SpaceMeasurement = z.infer<typeof spaceMeasurementSchema>;
