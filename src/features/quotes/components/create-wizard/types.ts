import { z } from 'zod';
import type { AttachmentItem as LogicAttachmentItem } from '../../logic/attachment-calc';

export type AttachmentItem = LogicAttachmentItem & { amount?: number };

export interface WizardQuoteItem {
    // Basic Product Info
    productId: string;
    productName: string;
    productSku?: string;
    category: string;
    unitPrice: number;
    quantity: number;
    imageUrl?: string;
    discount?: number;

    // Dimensions
    width?: number;
    height?: number;

    // Curtain Specifics
    roomType?: string;
    roomCustomName?: string;
    activationStatus?: 'active' | 'inactive';

    // Install
    installMethod?: string;
    installPosition?: string;
    installMethodCustom?: string;
    installPositionCustom?: string;
    groundClearance?: number;

    // Fabric
    openingStyle?: string;
    openingDetails?: number[];
    foldRatio?: number;
    fabricDirection?: 'HEIGHT' | 'WIDTH';
    fabricSize?: number;
    headerProcessType?: 'WRAPPED' | 'ATTACHED';

    // Calculation Results
    materialUsage?: number;
    processFee?: number;
    versionTag?: string;

    // Attachments
    attachments?: AttachmentItem[];

    // Common Extras
    remark?: string;

    // Wallpaper/Wallcloth Specifics
    calcType?: 'WALLPAPER' | 'WALLCLOTH';
    specWidth?: number;
    specLength?: number;
    cutLoss?: number;
    patternRepeat?: number; // 花距 (cm)
    widthLoss?: number; // 宽度损�?(cm)
    heightLoss?: number; // 高度损�?(cm)
    // 多墙段支�?
    wallSegments?: {
        id: string; // uuid
        width: number; // cm
        note?: string;
    }[];
}

export const wizardFormSchema = z.object({
    customerId: z.string().min(1, '请选择客户'),
    category: z.string().min(1, '请选择报价类型'),
    rooms: z.array(z.object({
        id: z.string(),
        name: z.string(),
        items: z.array(z.custom<WizardQuoteItem>())
    })),
});

export type WizardFormValues = z.infer<typeof wizardFormSchema>;
