export interface OfflineMeasurement {
    taskId: string;
    customerName: string;
    status: 'synced' | 'pending';
    address?: string;
}

export const offlineStore = {
    get: () => null,
    set: () => { },
    measurements: {
        get: async (id: string) => null as OfflineMeasurement | null,
        put: async (data: any) => { },
        update: async (id: string, data: any) => { },
    },
    getPendingSyncList: async () => [] as any[],
};
