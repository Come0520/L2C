export interface OfflineMeasurement {
    id?: string;
    taskId: string;
    measureNo?: string;
    customerName: string;
    customerPhone?: string;
    address?: string;
    status: 'synced' | 'pending';
    scheduledAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    // 离线数据存储
    data?: Record<string, unknown>;
    images?: string[];
    checkIn?: {
        lat: number;
        lng: number;
        address: string;
    };
}

export const offlineStore = {
    get: () => null,
    set: () => { },
    measurements: {
        get: async (_id: string) => null as OfflineMeasurement | null,
        put: async (_data: Partial<OfflineMeasurement>) => { },
        update: async (_id: string, _data: Partial<OfflineMeasurement>) => { },
    },
    getPendingSyncList: async () => [] as OfflineMeasurement[],
};
