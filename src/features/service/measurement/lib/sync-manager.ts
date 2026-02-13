import { offlineStore } from '@/shared/lib/offline-store';
import { getMeasureTasks } from '@/features/service/measurement/actions/queries';
import { submitMeasureData } from '@/features/service/measurement/actions/mutations';

export class SyncManager {
    static async syncOnlineTasks(_workerId: string) {
        try {
            const result = await getMeasureTasks({
                page: 1,
                pageSize: 50,
                status: 'DISPATCHED'
            });

            if (result.success && result.data) {
                // Save to local offline store
                for (const task of result.data) {
                    await offlineStore.measurements.put({
                        id: task.id,
                        taskId: task.id,
                        measureNo: task.measureNo,
                        customerName: task.customer?.name || 'Unknown',
                        customerPhone: task.customer?.phone || '',
                        // 使用可选链访问客户地址（类型定义可能不完整）
                        address: task.customer && 'addresses' in task.customer && Array.isArray((task.customer as { addresses?: { address?: string }[] }).addresses)
                            ? (task.customer as { addresses: { address?: string }[] }).addresses[0]?.address || ''
                            : '',
                        status: 'pending',
                        scheduledAt: task.scheduledAt ? new Date(task.scheduledAt) : new Date(),
                        createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
                        updatedAt: new Date(),
                    });
                }
                return result.data.length;
            }
            return 0;
        } catch (error) {
            console.error('Sync online tasks failed:', error);
            throw error;
        }
    }

    static async syncLocalChanges() {
        let successCount = 0;
        const errors: { id: string; error: unknown }[] = [];

        try {
            const pendingTasks = await offlineStore.getPendingSyncList();

            for (const localTask of pendingTasks) {
                try {
                    // Prepare data for submission
                    const { data, images, checkIn } = localTask;

                    if (!localTask.id || !data) continue;

                    const result = await submitMeasureData({
                        taskId: localTask.taskId,
                        resultData: data,
                        images: images || [],
                        checkInLocation: checkIn ? {
                            lat: checkIn.lat,
                            lng: checkIn.lng,
                            address: checkIn.address
                        } : undefined
                    });

                    if (result.success) {
                        successCount++;
                        // Update local status to synced
                        await offlineStore.measurements.update(localTask.id, {
                            status: 'synced',
                            updatedAt: new Date()
                        });
                    } else {
                        errors.push({ id: String(localTask.id), error: 'error' in result ? result.error : 'Unknown error' });
                    }
                } catch (err) {
                    errors.push({ id: String(localTask.id), error: err });
                }
            }
        } catch (error) {
            console.error('Sync local changes failed:', error);
            throw error;
        }

        if (errors.length > 0) {
            console.error('Sync partial errors:', errors);
        }

        return successCount;
    }
}
