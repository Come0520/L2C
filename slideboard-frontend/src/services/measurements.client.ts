import { MEASUREMENT_STATUS, MEASUREMENT_STATUS_TRANSITIONS, MeasurementStatus } from '@/constants/measurement-status';
import { supabase } from '@/lib/supabase/client';
import { Measurement, CreateMeasurementRequest, UpdateMeasurementRequest, MeasurementData } from '@/shared/types/measurement';
import { Database, Json } from '@/types/supabase';

type MeasurementOrderRow = Database['public']['Tables']['measurement_orders']['Row'];

interface MeasurementOrderWithRelations extends MeasurementOrderRow {
    sales_order: {
        id: string;
        sales_no: string;
        customer: { name: string; project_address: string | null } | null;
    } | null;
    quote_version: {
        id: string;
        quote: { quote_no: string } | null;
    } | null;
    measurer: { name: string | null } | null;
}


export const measurementService = {
    /**
     * Create measurement order
     */
    async createMeasurement(data: CreateMeasurementRequest) {
        // We need to find the sales_order_id from quoteVersionId if possible, 
        // or maybe the UI passes it? 
        // The CreateMeasurementRequest only has quoteVersionId.
        // We need to look up the sales order associated with this quote version.
        // Assuming quote_versions table has a link to sales_orders or quotes has it?
        // Actually, sales_orders has quote_version_id (OneToOne).
        // So we can find sales_order where quote_version_id matches.

        // First, let's try to find the sales order for this quote version
        const { data: salesOrder, error: soError } = await supabase
            .from('sales_orders')
            .select('id')
            .eq('quote_version_id', data.quoteVersionId)
            .single();

        if (soError && soError.code !== 'PGRST116') { // PGRST116 is no rows found
            // If no sales order found, maybe we can't create a measurement order yet?
            // Or maybe we create it without sales_order_id? But DB requires it (or we made it nullable in migration? we made it nullable in migration).
        }

        const { data: measurement, error } = await supabase
            .from('measurement_orders')
            .insert({
                quote_version_id: data.quoteVersionId,
                sales_order_id: salesOrder?.id,
                scheduled_at: data.scheduledAt,
                measurer_id: data.surveyorId,
                status: MEASUREMENT_STATUS.PENDING_MEASUREMENT
            })
            .select(`
        *, 
        sales_order:sales_orders(
          id,
          sales_no,
          customer:customers(name, project_address)
        ),
        measurer:users!measurer_id(name)
      `)
            .single();

        if (error) throw new Error(error.message);
        return this.mapToMeasurement(measurement as MeasurementOrderWithRelations);
    },

    /**
     * Update measurement order
     */
    async updateMeasurement(id: string, data: UpdateMeasurementRequest) {
        const updateData: Partial<MeasurementOrderRow> = {};
        
        // Check status transition if status is being updated
        if (data.status) {
            // Get current measurement to check status transition
            const { data: currentMeasurement, error: getError } = await supabase
                .from('measurement_orders')
                .select('status')
                .eq('id', id)
                .single();
            
            if (getError) throw new Error(getError.message);
            
            // Check if status transition is allowed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentStatus = currentMeasurement.status as MeasurementStatus;
            const allowedTransitions = MEASUREMENT_STATUS_TRANSITIONS[currentStatus] || [];
            
            if (!allowedTransitions.includes(data.status as MeasurementStatus)) {
                throw new Error(`Invalid status transition from ${currentStatus} to ${data.status}`);
            }
            
            updateData.status = data.status;
        }
        
        if (data.surveyorId) updateData.measurer_id = data.surveyorId;
        if (data.scheduledAt) updateData.scheduled_at = data.scheduledAt;
        if (data.completedAt) updateData.completed_at = data.completedAt;
        if (data.measurementData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            updateData.measurement_data = data.measurementData as unknown as Json;
        }

        const { data: measurement, error } = await supabase
            .from('measurement_orders')
            .update(updateData)
            .eq('id', id)
            .select(`
        *, 
        sales_order:sales_orders(
          id,
          sales_no,
          customer:customers(name, project_address)
        ),
        measurer:users!measurer_id(name)
      `)
            .single();

        if (error) throw new Error(error.message);
        return this.mapToMeasurement(measurement as MeasurementOrderWithRelations);
    },

    /**
     * Update measurement status
     */
    async updateMeasurementStatus(id: string, status: string) {
        // Get current measurement to check status transition
        const { data: currentMeasurement, error: getError } = await supabase
            .from('measurement_orders')
            .select('status')
            .eq('id', id)
            .single();
        
        if (getError) throw new Error(getError.message);
        
        // Check if status transition is allowed
        const currentStatus = currentMeasurement.status as MeasurementStatus;
        const allowedTransitions = MEASUREMENT_STATUS_TRANSITIONS[currentStatus] || [];
        
        if (!allowedTransitions.includes(status as MeasurementStatus)) {
            throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
        }
        
        const { data, error } = await supabase
            .from('measurement_orders')
            .update({ status })
            .eq('id', id)
            .select(`
        *, 
        sales_order:sales_orders(
          id,
          sales_no,
          customer:customers(name, project_address)
        ),
        measurer:users!measurer_id(name)
      `)
            .single();

        if (error) throw new Error(error.message);
        return this.mapToMeasurement(data as MeasurementOrderWithRelations);
    },

    /**
     * Upload measurement report
     */
    async uploadMeasurementReport(id: string, reportData: { reportUrl: string }) {
        const { data, error } = await supabase
            .from('measurement_orders')
            .update({ measurement_report_url: reportData.reportUrl } as any)
            .eq('id', id)
            .select(`
        *, 
        sales_order:sales_orders(
          id,
          sales_order_no,
          customer:customers(name, project_address)
        ),
        measurer:users!measurer_id(name)
      `)
            .single();

        if (error) throw new Error(error.message);
        return this.mapToMeasurement(data as MeasurementOrderWithRelations);
    },

    /**
     * Get measurements list
     */
    async getMeasurements(page: number = 1, pageSize: number = 10, status?: string, salesOrderId?: string, _customerName?: string, measurementNo?: string) {
        let query = supabase
        .from('measurement_orders')
        .select(`
        *, 
        sales_order:sales_orders(
          id,
          sales_no,
          customer:customers(name, project_address)
        ),
        measurer:users!measurer_id(name)
      `, { count: 'exact' });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (salesOrderId) {
            query = query.eq('sales_order_id', salesOrderId);
        }
        if (measurementNo) {
            query = query.ilike('measurement_no', `%${measurementNo}%`);
        }
        // Note: Filtering by customerName is complex with Supabase join.
        // We might need to filter on client side or use a different approach if strictly required.
        // For now, ignoring customerName filter in DB query.

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await query
            .range(from, to)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        return {
            measurements: (data || []).map((item: MeasurementOrderWithRelations) => this.mapToMeasurement(item)),
            total: count || 0
        };
    },

    /**
     * Get measurement by ID
     */
    async getMeasurementById(id: string) {
        const { data, error } = await supabase
            .from('measurement_orders')
            .select(`
        *, 
        sales_order:sales_orders(
          id,
          sales_no,
          customer:customers(name, project_address)
        ),
        measurer:users!measurer_id(name)
      `)
            .eq('id', id)
            .single();

        if (error) throw new Error(error.message);
        return this.mapToMeasurement(data as MeasurementOrderWithRelations);
    },

    /**
     * Delete measurement
     */
    async deleteMeasurement(id: string) {
        const { error } = await supabase
            .from('measurement_orders')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    // Helper to map DB result to Frontend Type
    mapToMeasurement(dbRecord: MeasurementOrderWithRelations): Measurement {
        return {
            id: dbRecord.id,
            quoteVersionId: dbRecord.quote_version_id,
            quoteId: '', // We might not have quote id directly if not selected
            quoteNo: '',
            customerName: dbRecord.sales_order?.customer?.name || '',
            projectAddress: dbRecord.sales_order?.customer?.project_address || '',
            surveyorId: dbRecord.measurer_id || undefined,
            surveyorName: dbRecord.measurer?.name,
            status: dbRecord.status as MeasurementStatus,
            scheduledAt: dbRecord.scheduled_at || undefined,
            completedAt: dbRecord.completed_at || undefined,
            measurementData: (dbRecord.measurement_data as MeasurementData) || undefined,
            homeScreenshotUrl: dbRecord.measurement_photos?.[0], // Assuming first photo is screenshot for now, or we need a specific field
            createdBy: dbRecord.created_by,
            createdAt: dbRecord.created_at,
            updatedAt: dbRecord.updated_at
        };
    },

    /**
     * Batch remind measurements
     */
    async batchRemindMeasurements(measurementIds: string[]) {
        // 这里实现批量提醒逻辑
        // 1. 获取所有需要提醒的测量单
        const { data: measurements, error: fetchError } = await supabase
            .from('measurement_orders')
            .select(`
                *,
                sales_order:sales_orders(
                    customer:customers(name)
                ),
                measurer:users!measurer_id(id, name, phone, email)
            `)
            .in('id', measurementIds);
        
        if (fetchError) throw new Error(fetchError.message);
        
        if (!measurements || measurements.length === 0) return;
        
        // 2. 为每个测量单创建提醒通知
        for (const m of measurements || []) {
            const measurement = m as MeasurementOrderWithRelations;
            // 这里可以根据实际需求发送不同类型的通知
            // 例如：发送短信、邮件、应用内通知等
            
            // 示例：创建应用内通知
            await supabase.from('notifications').insert({
                user_id: measurement.measurer_id,
                type: 'measurement_assigned',
                title: '新测量单指派',
                content: `您有一个新的测量单待处理，测量单号：${measurement.id.substring(0, 8)}`,
                metadata: {
                    measurement_id: measurement.id,
                    quote_no: measurement.quote_version?.quote?.quote_no,
                    scheduled_at: measurement.scheduled_at
                }
            });
        }
    },

    /**
     * Request reassign measurement
     */
    async requestReassign(measurementId: string, reason: string) {
        // 1. Update measurement status to measuring_assigning
        // 2. Add reassign reason to measurement_data
        // 3. Create notification for service dispatch team

        // First, get current measurement to update
        const { data: currentMeasurement, error: fetchError } = await supabase
            .from('measurement_orders')
            .select('id, measurement_data')
            .eq('id', measurementId)
            .single();

        if (fetchError) throw new Error(fetchError.message);

        // Update measurement status and add reassign reason
        const { data: updatedMeasurement, error: updateError } = await supabase
            .from('measurement_orders')
            .update({
                status: MEASUREMENT_STATUS.MEASURING_ASSIGNING,
                measurement_data: {
                    ...(currentMeasurement.measurement_data || {}),
                    reassignReason: reason,
                    reassignAt: new Date().toISOString()
                } as Json
            })
            .eq('id', measurementId)
            .select(`
                *,
                sales_order:sales_orders(
                    id,
                    sales_no,
                    customer:customers(name, project_address)
                ),
                quote_version:quote_versions(
                    id,
                    quote:quotes(quote_no)
                ),
                measurer:users!measurer_id(name)
            `)
            .single();

        if (updateError) throw new Error(updateError.message);

        // Find dispatchers and admins to notify
        const { data: dispatchers } = await supabase
            .from('users')
            .select('id')
            .in('role', ['SERVICE_DISPATCH', 'admin']);

        if (dispatchers && dispatchers.length > 0) {
            const notifications = dispatchers.map(user => ({
                user_id: user.id,
                type: 'measurement_reassign_request',
                title: '测量单重新分配请求',
                content: `测量单号 ${updatedMeasurement.measurement_no} 需要重新分配`,
                metadata: {
                    measurement_id: measurementId,
                    reason: reason,
                    measurement_no: updatedMeasurement.measurement_no
                },
                is_read: false
            }));

            await supabase.from('notifications').insert(notifications);
        }

        return this.mapToMeasurement(updatedMeasurement as MeasurementOrderWithRelations);
    }
};
