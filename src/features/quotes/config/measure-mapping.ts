import { measureItemSchema } from '@/features/service/measurement/schemas';
import { z } from 'zod';

export type MeasureItem = z.infer<typeof measureItemSchema>;

export interface QuoteItemDraft {
    roomName: string;
    width: number;
    height: number;
    attributes: Record<string, unknown>;
    remark?: string;
}

// Default Constants
export const DEFAULT_MAPPING_CONFIG = {
    DEFAULT_FOLD_RATIO: 2.0,
    DEFAULT_PROCESS_FEE: 0,
    DEFAULT_INSTALL_TYPE: 'TOP',
};

/**
 * Maps a single Measurement Item to a Quote Item Draft
 * @param measureItem The source measurement item
 * @returns A partial quote item ready for product selection
 */
export function mapMeasureItemToQuoteItem(measureItem: MeasureItem): QuoteItemDraft {
    const attributes: Record<string, unknown> = {
        windowType: measureItem.windowType,
        installType: measureItem.installType || DEFAULT_MAPPING_CONFIG.DEFAULT_INSTALL_TYPE,
        wallMaterial: measureItem.wallMaterial,
        hasBox: measureItem.hasBox,
        boxDepth: measureItem.boxDepth,
        isElectric: measureItem.isElectric,
    };

    return {
        roomName: measureItem.roomName,
        width: measureItem.width, // Assuming unit consistency (cm vs cm) or conversion needed
        height: measureItem.height,
        attributes,
        remark: measureItem.remark,
    };
}
