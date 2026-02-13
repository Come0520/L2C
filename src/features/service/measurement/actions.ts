'use server';

/**
 * 测量同步 Actions - 占位实现
 * TODO: 待测量模块正式开发后完善
 */

interface MeasurementSyncData {
    quoteId?: string;
    items?: { productId: string; width: number; height: number }[];
}

export async function syncMeasurements(_data: MeasurementSyncData) {
    return { success: true };
}

export async function getMeasurements(_id: string) {
    return { data: [] };
}
