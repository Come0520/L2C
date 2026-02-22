import { offlineStore } from '@/shared/lib/offline-store';
import { getMeasureTasks } from '@/features/service/measurement/actions/queries';
import { submitMeasureData } from '@/features/service/measurement/actions/workflows';
import { checkInMeasureTask } from '@/features/service/measurement/actions/check-in';
import { measureSheetSchema } from '@/features/service/measurement/schemas';
import { z } from 'zod';
import { logger } from '@/shared/lib/logger';

// Local Task Interface
interface LocalMeasureTask {
    id?: number;
    taskId?: string;
    // 使用 import { measureSheetSchema } from '../schemas';
    data?: z.infer<typeof measureSheetSchema>;
    images?: string[];
    checkIn?: { lat: number; lng: number; address?: string };
}


export class SyncManager {
    static async syncOnlineTasks(_workerId: string) {
        try {
            const result = await getMeasureTasks({
                page: 1,
                pageSize: 50,
                status: 'DISPATCHING'
            });

            if (result?.success && result?.data) {
                // Save to local offline store
                for (const task of result.data) {
                    // Safe access to customer properties
                    const customer = task.customer;
                    // 注意：address 属性在 MeasureTask 中可能位于 lead.address 或直接在 task 上
                    // 根据 types.ts: MeasureTask 包含 customer?: { name, phone } 和 lead?: { address, community }

                    await offlineStore.measurements.put({
                        id: task.id,
                        taskId: task.id,
                        measureNo: task.measureNo || '',
                        customerName: customer?.name || 'Unknown',
                        customerPhone: customer?.phone || '',
                        address: task.lead ? `${task.lead.community || ''} ${task.lead.address || ''}`.trim() : (task.address || ''),
                        status: 'pending',
                        scheduledAt: task.scheduledAt ? new Date(task.scheduledAt) : new Date(),
                        createdAt: new Date(), // MeasureTask 没有 createdAt，使用当前时间
                        updatedAt: new Date(),
                    });
                }
                return result.data.length;
            }
            return 0;
        } catch (error) {
            logger.error('Sync online tasks failed:', error);
            throw error;
        }
    }

    static async syncLocalChanges() {
        let successCount = 0;
        const errors: { id: string; error: unknown }[] = [];

        try {
            const pendingTasks = await offlineStore.getPendingSyncList();

            // 显式转换类型
            const tasksToSync = pendingTasks as unknown as LocalMeasureTask[];

            for (const localTask of tasksToSync) {
                try {
                    // Prepare data for submission
                    const { data, images, checkIn } = localTask;

                    if (!localTask.taskId) continue;

                    // 1. 如果有签到数据，先执行签到
                    if (checkIn) {
                        const checkInResult = await checkInMeasureTask({
                            taskId: localTask.taskId,
                            latitude: checkIn.lat,
                            longitude: checkIn.lng,
                            address: checkIn.address,
                        });

                        // 签到失败是否阻断后续提交？通常记录日志但继续尝试提交数据
                        if (!checkInResult.success) {
                            logger.warn(`Check-in failed for task ${localTask.taskId}:`, 'error' in checkInResult ? checkInResult.error : '');
                        }
                    }

                    if (data) {
                        // 构造符合 submitMeasureData (measureSheetSchema) 的数据
                        // 确保 data 符合 measureSheetSchema
                        const submissionData = {
                            taskId: localTask.taskId,
                            round: Number(data.round) || 1,
                            variant: String(data.variant || 'A'),
                            items: Array.isArray(data.items) ? data.items : [],
                            sitePhotos: Array.isArray(images) ? images : [],
                            sketchMap: typeof data.sketchMap === 'string' ? data.sketchMap : undefined
                        };

                        const result = await submitMeasureData(submissionData);

                        if (result.success) {
                            successCount++;
                            // Update local status to synced
                            if (localTask.id) {
                                await offlineStore.measurements.update(String(localTask.id), {
                                    status: 'synced',
                                    updatedAt: new Date()
                                });
                            }
                        } else {
                            const errorMsg = result && 'error' in result ? result.error : 'Unknown error';
                            errors.push({ id: String(localTask.id), error: errorMsg });
                        }
                    }
                } catch (err) {
                    errors.push({ id: String(localTask.id), error: err });
                }
            }
        } catch (error) {
            logger.error('Sync local changes failed:', error);
            throw error;
        }

        if (errors.length > 0) {
            logger.error('Sync partial errors:', errors);
        }

        return successCount;
    }
}
