import { offlineStore } from '@/shared/lib/offline-store';
import { getMeasureTasks, submitMeasureData } from '@/features/service/measurement/actions';

interface SyncError {
    id: string;
    error: unknown;
}

export class MeasureSyncManager {
    /**
     * 从服务器拉取分配给当前用户的任务 (Pull)
     * 用于工人每天早上"下载"任务到本�?
     */
    static async pullTasks(workerId: string) {
        try {
            // 1. 调用 Server Action 获取列表
            const result = await getMeasureTasks({ page: 1, pageSize: 50, status: 'PENDING_VISIT', workerId });

            if (!result || !result.success || !result.data) return;

            const tasks = result.data.data;

            // 2. 存入 IndexedDB
            await offlineStore.transaction('rw', offlineStore.measurements, async () => {
                for (const task of tasks) {
                    // 检查本地是否已存在且有未同步修�?
                    const existing = await offlineStore.measurements.where('taskId').equals(task.id).first();
                    if (existing && existing.status === 'pending') {
                        continue; // 本地有未提交的修改，跳过覆盖
                    }

                    // 转换并写�?更新
                    await offlineStore.measurements.put({
                        id: task.id, // 使用 TaskID 作为本地 ID
                        taskId: task.id,
                        leadId: task.leadId,
                        customerName: task.customer?.name || 'Unknown',
                        address: task.customer?.defaultAddress || '暂无地址',
                        status: 'draft',
                        data: { rooms: [], sitePhotos: [] },
                        createdAt: new Date(task.createdAt || Date.now()),
                        updatedAt: new Date(),
                    });
                }
            });

            return tasks.length;
        } catch (error) {
            console.error('Pull tasks failed:', error);
            throw error;
        }
    }

    /**
     * 将本地已完成的测量数据推送到服务�?(Push)
     */
    static async pushLocalChanges() {
        const pendingTasks = await offlineStore.getPendingSyncList();

        if (pendingTasks.length === 0) return 0;

        let successCount = 0;
        const errors: SyncError[] = [];

        for (const localTask of pendingTasks) {
            try {
                // 构造提交数�?
                const { rooms, sitePhotos, checkIn } = localTask.data;

                // 确保 checkIn 适配 submitMeasureDataSchema
                const checkInLocation = checkIn ? {
                    lat: checkIn.lat,
                    lng: checkIn.lng,
                    address: checkIn.address,
                } : undefined;

                // 转换窗户数据，确保包含所有必需属�?
                const transformedRooms = rooms.map((room) => ({
                    ...room,
                    windows: room.windows.map((window, windowIndex) => ({
                        ...window,
                        name: `W${windowIndex + 1}`,
                        type: window.type as 'STRAIGHT' | 'L_SHAPE' | 'U_SHAPE' | 'ARC' | 'CURVED' | 'OTHER',
                        installType: 'TOP' as const,
                        openType: 'SINGLE' as const
                    }))
                }));

                // 调用提交接口
                const result = await submitMeasureData({
                    taskId: localTask.taskId,
                    resultData: { rooms: transformedRooms },
                    images: sitePhotos || [],
                    checkInLocation
                });

                if (result.success) {
                    // 更新本地状态为 synced
                    await offlineStore.measurements.update(localTask.id, {
                        status: 'synced',
                        updatedAt: new Date()
                    });
                    successCount++;
                } else {
                    errors.push({ id: localTask.id, error: result.error });
                }
            } catch (err) {
                errors.push({ id: localTask.id, error: err });
            }
        }

        if (errors.length > 0) {
            console.error('Sync partial errors:', errors);
        }

        return successCount;
    }
}
