import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/client';
import {
    Installation,
    InstallationListItem,
    CreateInstallationRequest,
    UpdateInstallationRequest
} from '@/types/installation';
import { toDbFields, fromDbFields } from '@/utils/db-mapping';

interface InstallationQueryParams {
    page?: number;
    pageSize?: number;
    status?: string;
    salesOrderId?: string;
    customerName?: string;
    installationNo?: string;
    installationType?: string;
    startDate?: string;
    endDate?: string;
    installerId?: string;
    installationTeamId?: string;
}

export const installationService = {
    /**
     * Create installation order
     */
    async createInstallation(data: CreateInstallationRequest) {
        return withErrorHandler(async () => {
            const supabase = createClient();
            const { data: installation, error } = await supabase
                .from('installation_orders')
                .insert({
                    sales_order_id: data.salesOrderId,
                    measurement_id: data.measurementId,
                    installation_type: data.installationType || 'standard',
                    scheduled_at: data.scheduledAt,
                    appointment_time_slot: data.appointmentTimeSlot,
                    estimated_duration: data.estimatedDuration,
                    installation_contact: data.installationContact,
                    installation_phone: data.installationPhone,
                    project_address: data.installationAddress,
                    installer_id: data.installerId,
                    installation_team_id: data.installationTeamId,
                    environment_requirements: data.environmentRequirements,
                    required_tools: data.requiredTools,
                    required_materials: data.requiredMaterials,
                    special_instructions: data.specialInstructions,
                    status: 'pending',
                    acceptance_status: 'pending',
                    rework_count: 0,
                    installation_fee: 0,
                    additional_fee: 0,
                    material_fee: 0,
                    installation_data: {},
                    created_by: (await supabase.auth.getUser()).data.user?.id || ''
                })
                .select(`
                    *, 
                    sales_order:sales_orders(id, sales_no, customer:customers(name, phone, project_address)),
                    installation_team:installation_teams(id, name),
                    installer:users(name)
                `)
                .single();

            if (error) throw error;
            return this.mapToInstallation(installation);
        });
    },

    /**
     * Update installation order
     */
    async updateInstallation(id: string, data: UpdateInstallationRequest) {
        return withErrorHandler(async () => {
            const supabase = createClient();

            // Use toDbFields to automatically map camelCase to snake_case
            // Explicitly handle fields that might need special mapping or skipping if necessary
            // In this case, most map directly.
            const updateData = toDbFields(data, {
                // Explicitly specified in original code, but standard conversion should work.
                // Verify any non-standard mappings from original code?
                // Original: customerSignature -> customer_signature (Standard)
                // Original: installationAddress -> project_address? NO, updateInstallation input uses standard fields?
                // Wait, CreateInstallationRequest has `installationAddress` mapping to `project_address`.
                // UpdateInstallationRequest probably matches DB fields closer or uses standard camelCase.
                // Let's assume standard camelCase -> snake_case for Update.
            });

            // Handle potential field name mismatches if UpdateInstallationRequest uses different names than DB schema
            // e.g. if input has `installationAddress` but DB is `project_address`.
            // Check UpdateInstallationRequest definition if possible. Assuming standard mapping.

            const { data: installation, error } = await supabase
                .from('installation_orders')
                .update(updateData)
                .eq('id', id)
                .select(`
                    *, 
                    sales_order:sales_orders(id, sales_no, customer:customers(name, phone, project_address)),
                    installation_team:installation_teams(id, name),
                    installer:users(name)
                `)
                .single();

            if (error) throw error;
            return this.mapToInstallation(installation);
        });
    },

    /**
     * Update installation status
     */
    async updateInstallationStatus(id: string, status: string) {
        return withErrorHandler(async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('installation_orders')
                .update({
                    status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select(`
                    *, 
                    sales_order:sales_orders(id, sales_no, customer:customers(name, phone, project_address)),
                    installation_team:installation_teams(id, name),
                    installer:users(name)
                `)
                .single();

            if (error) throw error;
            return this.mapToInstallation(data);
        });
    },

    /**
     * Update acceptance status
     */
    async updateAcceptanceStatus(id: string, status: string, notes?: string) {
        return withErrorHandler(async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('installation_orders')
                .update({
                    acceptance_status: status,
                    acceptance_notes: notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select(`
                    *, 
                    sales_order:sales_orders(id, sales_no, customer:customers(name, phone, project_address)),
                    installation_team:installation_teams(id, name),
                    installer:users(name)
                `)
                .single();

            if (error) throw error;
            return this.mapToInstallation(data);
        });
    },

    /**
     * Upload installation report (updates installation_data)
     */
    async uploadInstallationReport(id: string, reportData: Record<string, unknown>) {
        return withErrorHandler(async () => {
            const supabase = createClient();

            // Get existing installation data first
            const { data: existingInstallation, error: getError } = await supabase
                .from('installation_orders')
                .select('installation_data')
                .eq('id', id)
                .single();

            if (getError) throw getError;

            // Merge existing data with new report data
            const updatedInstallationData = {
                ...((existingInstallation.installation_data as Record<string, unknown>) || {}),
                ...reportData
            };

            const { data, error } = await supabase
                .from('installation_orders')
                .update({
                    installation_data: updatedInstallationData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select(`
                    *, 
                    sales_order:sales_orders(id, sales_no, customer:customers(name, phone, project_address)),
                    installation_team:installation_teams(id, name),
                    installer:users(name)
                `)
                .single();

            if (error) throw error;
            return this.mapToInstallation(data);
        });
    },

    /**
     * Upload installation photos
     */
    async uploadInstallationPhotos(id: string, photosData: { photoUrls: string[] }) {
        return withErrorHandler(async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('installation_orders')
                .update({
                    installation_photos: photosData.photoUrls,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select(`
                    *, 
                    sales_order:sales_orders(id, sales_no, customer:customers(name, phone, project_address)),
                    installation_team:installation_teams(id, name),
                    installer:users(name)
                `)
                .single();

            if (error) throw error;
            return this.mapToInstallation(data);
        });
    },

    /**
     * Get installations list
     */
    async getInstallations(params: InstallationQueryParams = {}) {
        return withErrorHandler(async () => {
            const supabase = createClient();
            const {
                page = 1,
                pageSize = 10,
                status,
                salesOrderId,
                customerName,
                installationNo,
                installationType,
                startDate,
                endDate,
                installerId,
                installationTeamId
            } = params;

            let query = supabase
                .from('installation_orders')
                .select(`
                    id, installation_no, installation_type, status, acceptance_status, 
                    scheduled_at, appointment_time_slot, estimated_duration, 
                    installer_id, installation_team_id,
                    sales_order_id, sales_order:sales_orders(sales_no, customer:customers(name, project_address)),
                    installer:users(name),
                    installation_team:installation_teams(name),
                    quality_rating, customer_satisfaction,
                    created_at, updated_at
                `, { count: 'exact' });

            // Apply filters
            if (status && status !== 'all') {
                query = query.eq('status', status);
            }
            if (salesOrderId) {
                query = query.eq('sales_order_id', salesOrderId);
            }
            if (installationType && installationType !== 'all') {
                query = query.eq('installation_type', installationType);
            }
            if (installerId) {
                query = query.eq('installer_id', installerId);
            }
            if (installationTeamId) {
                query = query.eq('installation_team_id', installationTeamId);
            }
            if (startDate) {
                query = query.gte('scheduled_at', startDate);
            }
            if (endDate) {
                query = query.lte('scheduled_at', endDate);
            }
            if (customerName) {
                query = query.ilike('sales_order.customer.name', `%${customerName}%`);
            }
            if (installationNo) {
                query = query.ilike('installation_no', `%${installationNo}%`);
            }

            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, count, error } = await query
                .range(from, to)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                installations: (data || []).map(this.mapToInstallationListItem),
                total: count || 0
            };
        });
    },

    /**
     * Get installation by ID
     */
    async getInstallationById(id: string) {
        return withErrorHandler(async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('installation_orders')
                .select(`
                    *, 
                    sales_order:sales_orders(
                        id, sales_no, customer:customers(name, phone, project_address),
                        measurement_id, measurement:measurements(measurement_no)
                    ),
                    installation_team:installation_teams(id, name, team_leader_id, team_leader:users(name)),
                    installer:users(name, phone, email),
                    quality_check:installation_quality_checks(*),
                    customer_feedback:installation_customer_feedback(*),
                    created_by_user:users(name)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return this.mapToInstallation(data);
        });
    },

    /**
     * Delete installation
     */
    async deleteInstallation(id: string) {
        const supabase = createClient();
        const { error } = await supabase
            .from('installation_orders')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    /**
     * Get installation count by status
     */
    async getInstallationCountByStatus() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('installation_orders')
            .select('status');

        if (error) throw new Error(error.message);
        const counts: Record<string, number> = {};
        for (const row of data || []) {
            const status = row.status as string;
            counts[status] = (counts[status] || 0) + 1;
        }
        return Object.entries(counts).map(([status, count]) => ({ status, count }));
    },

    /**
     * Get installation statistics
     */
    async getInstallationStatistics(startDate: string, endDate: string) {
        const supabase = createClient();

        // Get total installations
        const { count: totalCount, error: totalError } = await supabase
            .from('installation_orders')
            .select('*', { count: 'exact' })
            .gte('scheduled_at', startDate)
            .lte('scheduled_at', endDate)
            .single();

        if (totalError) throw new Error(totalError.message);

        // Get completed installations
        const { count: completedCount, error: completedError } = await supabase
            .from('installation_orders')
            .select('*', { count: 'exact' })
            .eq('status', 'completed')
            .gte('scheduled_at', startDate)
            .lte('scheduled_at', endDate)
            .single();

        if (completedError) throw new Error(completedError.message);

        // Get canceled installations
        const { count: canceledCount, error: canceledError } = await supabase
            .from('installation_orders')
            .select('*', { count: 'exact' })
            .eq('status', 'canceled')
            .gte('scheduled_at', startDate)
            .lte('scheduled_at', endDate)
            .single();

        if (canceledError) throw new Error(canceledError.message);

        // Get average rating
        const { data: ratingData, error: ratingError } = await supabase
            .from('installation_orders')
            .select('quality_rating')
            .not('quality_rating', 'is', null)
            .gte('scheduled_at', startDate)
            .lte('scheduled_at', endDate);

        if (ratingError) throw new Error(ratingError.message);

        const averageRating = ratingData && ratingData.length > 0
            ? ratingData.reduce((sum: number, item: { quality_rating: number }) => sum + item.quality_rating, 0) / ratingData.length
            : 0;

        return {
            total: totalCount || 0,
            completed: completedCount || 0,
            canceled: canceledCount || 0,
            pending: (totalCount || 0) - (completedCount || 0) - (canceledCount || 0),
            averageRating: parseFloat(averageRating.toFixed(2))
        };
    },

    // Helper to map DB result to InstallationListItem Type
    mapToInstallationListItem(dbRecord: Record<string, any>): InstallationListItem {
        return {
            id: dbRecord.id,
            installationNo: dbRecord.installation_no || dbRecord.sales_order?.sales_no || '',
            salesOrderNo: dbRecord.sales_order?.sales_no || '',
            customerName: dbRecord.sales_order?.customer?.name || '',
            projectAddress: dbRecord.sales_order?.customer?.project_address || '',
            installationType: dbRecord.installation_type,
            status: dbRecord.status,
            acceptanceStatus: dbRecord.acceptance_status,
            scheduledAt: dbRecord.scheduled_at,
            installerName: dbRecord.installer?.name,
            installationTeamName: dbRecord.installation_team?.name,
            qualityRating: dbRecord.quality_rating,
            customerSatisfaction: dbRecord.customer_satisfaction,
            createdAt: dbRecord.created_at,
            updatedAt: dbRecord.updated_at
        };
    },

    // Helper to map DB result to Frontend Type
    mapToInstallation(dbRecord: Record<string, any>): Installation {
        const base = fromDbFields<any>(dbRecord);

        // Manual overrides and complex logic
        return {
            ...base,
            // ID and Relation Mapping
            id: dbRecord.id, // Explicitly set ID to ensure
            installationNo: dbRecord.installation_no || dbRecord.sales_order?.sales_no || '',
            salesOrderId: dbRecord.sales_order_id,
            salesOrderNo: dbRecord.sales_order?.sales_no || '',
            measurementId: dbRecord.sales_order?.measurement_id || '',
            customerId: dbRecord.sales_order?.customer?.id || '',
            customerName: dbRecord.sales_order?.customer?.name || '',
            customerPhone: dbRecord.sales_order?.customer?.phone || '',
            projectAddress: dbRecord.project_address || dbRecord.sales_order?.customer?.project_address || '',

            // Nested Object Defaults
            environmentRequirements: dbRecord.environment_requirements || { powerSupply: false, waterSupply: false, ventilation: false, lighting: false },
            requiredTools: dbRecord.required_tools || [],
            requiredMaterials: dbRecord.required_materials || [],
            installationData: dbRecord.installation_data || {},
            installationPhotos: dbRecord.installation_photos || [],
            beforePhotos: dbRecord.before_photos || [],
            afterPhotos: dbRecord.after_photos || [],

            // Names from relations
            installerName: dbRecord.installer?.name,
            installationTeamName: dbRecord.installation_team?.name,
            createdByName: dbRecord.created_by_user?.name || '',

            // Other computed/renamed fields
            actualDuration: dbRecord.installation_data?.actualDuration,
            reworkCount: dbRecord.rework_count || 0,
            installationFee: dbRecord.installation_fee || 0,
            additionalFee: dbRecord.additional_fee || 0,
            materialFee: dbRecord.material_fee || 0,

            // Ensure dates are passed through (fromDbFields handles keys, but values are raw)
            createdAt: dbRecord.created_at,
            updatedAt: dbRecord.updated_at,
            completedAt: dbRecord.completed_at
        };
    }
};
