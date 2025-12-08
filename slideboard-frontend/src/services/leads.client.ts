import { createClient } from '@/lib/supabase/client'
import { LeadItem, LeadFilter } from '@/types/lead'
import { Database } from '@/types/supabase'
import { toDbFields, fromDbFields } from '@/utils/db-mapping'

type LeadRow = Database['public']['Tables']['leads']['Row'];

// 数据库线索记录类型
export interface LeadFromDB extends LeadRow {}

// 线索更新请求类型
export interface UpdateLeadRequest {
    customerName?: string;
    phone?: string;
    projectAddress?: string;
    customerLevel?: string;
    budgetMin?: number;
    budgetMax?: number;
    requirements?: string[];
    businessTags?: string[];
    appointmentTime?: string;
    appointmentReminder?: '48h' | '24h' | null;
    constructionProgress?: 'just-signed' | 'plumbing' | 'masonry' | 'painting' | 'installation' | 'stalled';
    expectedPurchaseDate?: string;
    expectedCheckInDate?: string;
    areaSize?: number;
}

// 线索导入行类型
export interface LeadImportRow {
    customer_name: string;
    phone: string;
    project_address: string;
    source?: string;
}

// 测量记录类型
export interface MeasurementRecord {
    measurement_time?: string;
    measurement_person?: string;
    measurement_address?: string;
    notes?: string;
    [key: string]: string | number | boolean | null | undefined;
}

// 报价记录类型
export interface QuoteRecord {
    quote_number?: string;
    quote_amount?: number;
    quote_time?: string;
    quote_status?: string;
    [key: string]: string | number | boolean | null | undefined;
}

// 安装记录类型
export interface InstallationRecord {
    installation_time?: string;
    installation_person?: string;
    installation_address?: string;
    notes?: string;
    [key: string]: string | number | boolean | null | undefined;
}

// 审批记录类型
export interface ApprovalRecord {
    approval_type?: string;
    approval_reason?: string;
    approval_status?: string;
    approved_by_id?: string;
    approved_at?: string;
    [key: string]: string | number | boolean | null | undefined;
}

export const leadService = {
    /**
     * 获取线索列表
     */
    async getLeads(_page: number, pageSize: number, filters: Partial<LeadFilter>, cursor?: string) {
        const supabase = createClient()

        let query = supabase
            .from('leads')
            .select(`
        id, name, phone, project_address, source, status, customer_level, 
        budget_min, budget_max, requirements, business_tags, appointment_time, 
        appointment_reminder, construction_progress, expected_purchase_date, 
        expected_check_in_date, area_size, lead_number, quote_versions, 
        measurement_completed, installation_completed, financial_status, 
        expected_measurement_date, expected_installation_date, total_quote_amount, 
        last_status_change_at, last_status_change_by_id, is_cancelled, cancellation_reason, 
        is_paused, pause_reason, created_at, updated_at, 
        assigned_to_id, designer_id, shopping_guide_id, created_by_id
      `, { count: 'exact' })

        // 应用筛选条件
        if (filters.searchTerm) {
            query = query.or(`name.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%`)
        }
        if (filters.status && filters.status !== 'all') {
            query = query.eq('status', filters.status)
        }
        if (filters.source && filters.source !== 'all') {
            query = query.eq('source', filters.source)
        }
        if (filters.customerLevel && filters.customerLevel !== 'all') {
            query = query.eq('customer_level', filters.customerLevel)
        }
        // 人员筛选
        if (filters.owner) query = query.eq('assigned_to_id', filters.owner)
        if (filters.designer) query = query.eq('designer_id', filters.designer)
        if (filters.shoppingGuide) query = query.eq('shopping_guide_id', filters.shoppingGuide)

        // 标签筛选 (数组包含)
        if (filters.businessTags && filters.businessTags.length > 0) {
            query = query.contains('business_tags', filters.businessTags)
        }

        // 时间范围筛选
        if (filters.dateRange?.start) {
            query = query.gte('created_at', filters.dateRange.start)
        }
        if (filters.dateRange?.end) {
            query = query.lte('created_at', filters.dateRange.end)
        }

        // 排序和分页
        query = query.order('created_at', { ascending: false })
        
        // 基于游标的分页
        if (cursor) {
            query = query.lt('created_at', cursor)
        }
        
        // 限制返回数量，获取比请求多一条用于检测是否有下一页
        query = query.limit(pageSize + 1)

        const { data, count, error } = await query

        if (error) {
            throw new Error(error.message)
        }

        const leads = (data || []).map(mapDbToLead)
        
        // 检测是否有下一页
        const hasNextPage = leads.length > pageSize
        // 如果有下一页，移除最后一条（额外获取的那条）
        const paginatedLeads = hasNextPage ? leads.slice(0, -1) : leads
        // 获取下一页的游标（最后一条记录的 created_at）
        const nextCursor = paginatedLeads.length > 0 ? paginatedLeads[paginatedLeads.length - 1]?.createdAt || null : null

        return {
            data: paginatedLeads,
            total: count || 0,
            hasNextPage,
            nextCursor
        }
    },

    /**
     * 获取单个线索详情
     */
    async getLeadById(id: string) {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('leads')
            .select(`
        id, name, phone, project_address, source, status, customer_level,
        budget_min, budget_max, requirements, business_tags, appointment_time,
        appointment_reminder, construction_progress, expected_purchase_date,
        expected_check_in_date, area_size, lead_number, quote_versions,
        measurement_completed, installation_completed, financial_status,
        expected_measurement_date, expected_installation_date, total_quote_amount,
        last_status_change_at, last_status_change_by_id, is_cancelled, cancellation_reason,
        is_paused, pause_reason, created_at, updated_at,
        assigned_to_id, designer_id, shopping_guide_id, created_by_id
      `)
            .eq('id', id)
            .single()

        if (error) {
            throw new Error(error.message)
        }

        return mapDbToLead(data as LeadFromDB)
    },

    /**
     * 创建线索
     */
    async createLead(data: Partial<LeadItem>) {
        const supabase = createClient()

        // 获取当前用户作为创建者
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const dbData = {
            ...toDbFields(data, {
                customerName: 'name',
            }),
            status: data.status || 'PENDING_ASSIGNMENT',
            customer_level: data.customerLevel || 'C',
            created_by_id: user.id,
        }

        const { data: newLead, error } = await supabase
            .from('leads')
            .insert(dbData)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return mapDbToLead(newLead)
    },

    /**
     * 分配线索
     */
    async assignLead(leadId: string, assigneeId: string, reason?: string) {
        const supabase = createClient()

        // 使用 RPC 调用以保证原子性 (更新 leads 表并插入 assignment 记录)
        // 需要在数据库创建 assign_lead 函数
        const { error } = await supabase.rpc('assign_lead', {
            p_lead_id: leadId,
            p_assignee_id: assigneeId,
            p_reason: reason
        })

        if (error) throw new Error(error.message)
    },

    /**
     * 更新线索状态
     */
    async updateLeadStatus(id: string, status: string, comment?: string, _attachedFiles?: any[]) {
        const supabase = createClient()
        
        // 获取当前用户ID
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')
        
        // 获取当前线索状态
        const { data: currentLead, error: getError } = await supabase
            .from('leads')
            .select('status')
            .eq('id', id)
            .single()
        
        if (getError) {
            throw new Error('Failed to get current lead status: ' + getError.message)
        }
        
        // 验证状态流转是否合法
        const { data: validationResult, error: validationError } = await supabase
            .rpc('validate_lead_status_transition', {
                lead_id: id,
                new_status: status,
                current_user_id: user.id
            })
        
        if (validationError) {
            throw new Error('Status transition validation failed: ' + validationError.message)
        }
        
        if (validationResult && !validationResult[0]?.is_valid) {
            throw new Error('Invalid status transition: ' + (validationResult[0]?.error_message || 'Unknown error'))
        }
        
        // 更新线索状态，同时设置last_status_change_by_id
        const updateResult = await supabase
            .from('leads')
            .update({
                status,
                last_status_change_by_id: user.id,
                last_status_change_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()

        if (updateResult.error) throw new Error('Failed to update lead status: ' + updateResult.error.message)
        
        // 手动记录状态变更历史，以便支持自定义注释
        if (currentLead.status !== status) {
            const { error: historyError } = await supabase.from('lead_status_history').insert({
                lead_id: id,
                from_status: currentLead.status,
                to_status: status,
                changed_by_id: user.id,
                changed_at: new Date().toISOString(),
                comment: comment || 'Status updated via API'
            })
            
            if (historyError) {
                console.error('Failed to record status change history:', historyError)
                // Don't throw error here, as the main status update was successful
            }
        }
    },

    /**
     * 更新线索信息
     */
    async patchLead(id: string, data: UpdateLeadRequest) {
        const supabase = createClient()

        // 转换字段名为 snake_case
        const dbData: Partial<LeadFromDB> = toDbFields(data, {
            customerName: 'name',
            // 其他字段由 toDbFields 自动处理 (e.g. projectAddress -> project_address)
        });

        const { data: updated, error } = await supabase
            .from('leads')
            .update(dbData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return mapDbToLead(updated)
    },

    /**
     * 批量导入线索
     */
    async importLeads(rows: LeadImportRow[]) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const leadsToInsert = rows.map(row => ({
            name: row.customer_name,
            phone: row.phone,
            project_address: row.project_address,
            source: row.source || 'import',
            status: 'new',
            created_by_id: user.id
        }))

        const { error } = await supabase
            .from('leads')
            .insert(leadsToInsert)

        if (error) {
            return { success: 0, failed: rows.length }
        }

        return { success: rows.length, failed: 0 }
    },

    // 占位方法，后续实现
    async getLeadAssignments(_leadId: string) { void _leadId; return [] },
    async findDuplicateGroups(_limit = 1000) { void _limit; return [] },
    async mergeLeads(_primaryId: string, _duplicateIds: string[]) { void _primaryId; void _duplicateIds; },
    async getLeadWarnings() { return { followUpStale: 0, quotedNoDraft: 0 } },
    subscribeToLeads(_callback: () => void) { void _callback; return { unsubscribe: () => { } } },
    async getLeadsForKanban() {
        // 复用 getLeads 但 pageSize 大一点
        const res = await this.getLeads(1, 100, {})
        return res.data
    },
    
    /**
     * 获取线索状态历史
     */
    async getLeadStatusHistory(leadId: string) {
        const supabase = createClient()
        
        // 调用数据库函数获取状态历史
        const { data, error } = await supabase
            .rpc('get_lead_status_history', { lead_id: leadId })
        
        if (error) {
            return []
        }
        
        return data || []
    },
    
    /**
     * 获取线索跟进记录
     */
    async getLeadFollowUps(leadId: string) {
        const supabase = createClient()
        
        const { data, error } = await supabase
            .from('lead_follow_up_records')
            .select(`
                id, follow_up_type, content, result, note,
                next_follow_up_time, appointment_time, created_at, created_by_id,
                creator:users(name)
            `)
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })
        
        if (error) {
            return []
        }
        
        return data || []
    },
    
    // 测量记录相关方法
    /**
     * 创建测量记录
     */
    async createMeasurementRecord(leadId: string, data: MeasurementRecord) {
        const supabase = createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')
        
        const { data: newRecord, error } = await supabase
            .from('lead_measurement_records')
            .insert({
                lead_id: leadId,
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single()
        
        if (error) throw new Error('Failed to create measurement record: ' + error.message)
        return newRecord
    },
    
    /**
     * 获取测量记录
     */
    async getMeasurementRecord(leadId: string) {
        const supabase = createClient()
        
        const { data, error } = await supabase
            .from('lead_measurement_records')
            .select('id, lead_id, measurement_time, measurement_person, measurement_address, notes, created_at, updated_at')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        
        if (error) {
            if (error.code === 'PGRST116') return null // 没有找到记录
            throw new Error('Failed to get measurement record: ' + error.message)
        }
        return data
    },
    
    // 报价记录相关方法
    /**
     * 创建报价记录
     */
    async createQuoteRecord(leadId: string, data: QuoteRecord) {
        const supabase = createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')
        
        const { data: newRecord, error } = await supabase
            .from('lead_quote_records')
            .insert({
                lead_id: leadId,
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single()
        
        if (error) throw new Error('Failed to create quote record: ' + error.message)
        return newRecord
    },
    
    /**
     * 获取报价记录
     */
    async getQuoteRecords(leadId: string) {
        const supabase = createClient()
        
        const { data, error } = await supabase
            .from('lead_quote_records')
            .select('id, lead_id, quote_number, quote_amount, quote_time, quote_status, created_at, updated_at')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })
        
        if (error) throw new Error('Failed to get quote records: ' + error.message)
        return data || []
    },
    
    // 安装记录相关方法
    /**
     * 创建安装记录
     */
    async createInstallationRecord(leadId: string, data: InstallationRecord) {
        const supabase = createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')
        
        const { data: newRecord, error } = await supabase
            .from('lead_installation_records')
            .insert({
                lead_id: leadId,
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single()
        
        if (error) throw new Error('Failed to create installation record: ' + error.message)
        return newRecord
    },
    
    /**
     * 获取安装记录
     */
    async getInstallationRecord(leadId: string) {
        const supabase = createClient()
        
        const { data, error } = await supabase
            .from('lead_installation_records')
            .select('id, lead_id, installation_time, installation_person, installation_address, notes, created_at, updated_at')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        
        if (error) {
            if (error.code === 'PGRST116') return null // 没有找到记录
            throw new Error('Failed to get installation record: ' + error.message)
        }
        return data
    },
    
    // 附件记录相关方法
    /**
     * 上传附件
     */
    async uploadAttachment(leadId: string, file: File, attachmentType: string) {
        const supabase = createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')
        
        // 生成唯一文件名
        const fileName = `${Date.now()}_${file.name}`
        const filePath = `${leadId}/${fileName}`
        
        // 上传文件到存储
        const { error: uploadError } = await supabase
            .storage
            .from('lead-attachments')
            .upload(filePath, file)
        
        if (uploadError) throw new Error('Failed to upload file: ' + uploadError.message)
        
        // 获取文件URL
        const { data: publicUrl } = supabase
            .storage
            .from('lead-attachments')
            .getPublicUrl(filePath)
        
        // 保存附件记录
        const { data: newRecord, error: dbError } = await supabase
            .from('lead_attachment_records')
            .insert({
                lead_id: leadId,
                file_name: file.name,
                file_path: publicUrl.publicUrl,
                file_type: file.type,
                file_size: file.size,
                uploaded_by_id: user.id,
                attachment_type: attachmentType
            })
            .select()
            .single()
        
        if (dbError) throw new Error('Failed to create attachment record: ' + dbError.message)
        return newRecord
    },
    
    /**
     * 获取附件记录
     */
    async getAttachments(leadId: string, attachmentType?: string) {
        const supabase = createClient()
        
        let query = supabase
            .from('lead_attachment_records')
            .select('id, lead_id, file_name, file_path, file_type, file_size, uploaded_by_id, uploaded_at, attachment_type')
            .eq('lead_id', leadId)
            .order('uploaded_at', { ascending: false })
        
        if (attachmentType) {
            query = query.eq('attachment_type', attachmentType)
        }
        
        const { data, error } = await query
        if (error) throw new Error('Failed to get attachments: ' + error.message)
        return data || []
    },
    
    // 审批记录相关方法
    /**
     * 创建审批记录
     */
    async createApprovalRecord(leadId: string, data: ApprovalRecord) {
        const supabase = createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')
        
        const { data: newRecord, error } = await supabase
            .from('lead_approval_records')
            .insert({
                lead_id: leadId,
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single()
        
        if (error) throw new Error('Failed to create approval record: ' + error.message)
        return newRecord
    },
    
    /**
     * 获取审批记录
     */
    async getApprovalRecords(leadId: string) {
        const supabase = createClient()
        
        const { data, error } = await supabase
            .from('lead_approval_records')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })
        
        if (error) throw new Error('Failed to get approval records: ' + error.message)
        return data || []
    },

    async getAvailableLeadTags(filters?: { category?: string; isActive?: boolean; isSystem?: boolean }) {
        const supabase = createClient()

        let query = supabase
            .from('lead_tags')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true })

        if (filters?.category) {
            query = query.eq('tag_category', filters.category)
        }
        if (typeof filters?.isActive === 'boolean') {
            query = query.eq('is_active', filters.isActive)
        }
        if (typeof filters?.isSystem === 'boolean') {
            query = query.eq('is_system', filters.isSystem)
        }

        const { data, error } = await query
        if (error) throw new Error('Failed to fetch lead tags: ' + error.message)
        return data || []
    },

    async getLeadTags(leadId: string) {
        const supabase = createClient()
        const { data, error } = await supabase.rpc('get_lead_tags', { p_lead_id: leadId })
        if (error) throw new Error('Failed to fetch lead tags: ' + error.message)
        return data || []
    },

    async assignTagsToLead(leadId: string, tagIds: string[], assignedById: string) {
        const supabase = createClient()
        if (!Array.isArray(tagIds) || tagIds.length === 0) {
            throw new Error('tagIds must be a non-empty array')
        }
        const results = await Promise.all(
            tagIds.map(tagId =>
                supabase.rpc('assign_tag_to_lead', {
                    p_lead_id: leadId,
                    p_tag_id: tagId,
                    p_assigned_by_id: assignedById
                })
            )
        )
        const errorItem = results.find(r => r.error)
        if (errorItem && errorItem.error) throw new Error('Failed to assign tag: ' + errorItem.error.message)
    },

    async removeTagFromLead(leadId: string, tagId: string, removedById: string) {
        const supabase = createClient()
        const { data, error } = await supabase.rpc('remove_tag_from_lead', {
            p_lead_id: leadId,
            p_tag_id: tagId,
            p_removed_by_id: removedById
        })
        if (error) throw new Error('Failed to remove tag: ' + error.message)
        if (!data) throw new Error('Cannot remove auto-assigned system tags')
        return true
    },

    async createLeadTag(input: { name: string; tag_category: string; color: string; description?: string }) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('lead_tags')
            .insert({
                name: input.name,
                tag_category: input.tag_category,
                color: input.color,
                description: input.description ?? '',
                is_system: false,
                is_active: true
            })
            .select()
            .single()
        if (error) throw new Error('Failed to create tag: ' + error.message)
        return data
    },

    async deleteLeadTag(id: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('lead_tags')
            .delete()
            .eq('id', id)
        if (error) throw new Error('Failed to delete tag: ' + error.message)
        return true
    }
}

// 数据库对象映射到前端类型
function mapDbToLead(dbRecord: LeadFromDB): LeadItem {
    // 1. 自动映射基础字段
    const base = fromDbFields<Partial<LeadItem>>(dbRecord, {
        name: 'customerName',
        lead_number: 'leadNumber',
        // 跳过需要特殊处理的字段
        status: null,
        customer_level: null,
        business_tags: null,
        updated_at: null, // 映射到 lastFollowUpAt
        designer_id: null,
        shopping_guide_id: null,
        last_status_change_by_id: null,
        created_by_id: null, // LeadItem seems not to have createdBy relation loaded here
        assigned_to_id: null,
        quote_versions: null, // mapped manually with default
    });

    // 2. 手动组装复杂结构和默认值
    return {
        ...base,
        leadNumber: dbRecord.lead_number || dbRecord.id.slice(0, 8),
        quoteVersions: dbRecord.quote_versions || 0,
        budgetMin: dbRecord.budget_min || 0,
        budgetMax: dbRecord.budget_max || 0,
        projectAddress: dbRecord.project_address || '',
        requirements: dbRecord.requirements || [],
        customerLevel: normalizeCustomerLevel(dbRecord.customer_level),
        status: normalizeLeadStatus(dbRecord.status),
        businessTags: normalizeBusinessTags(dbRecord.business_tags),
        lastFollowUpAt: dbRecord.updated_at, // 暂用 updated_at
        
        // 布尔值默认处理
        measurementCompleted: dbRecord.measurement_completed || false,
        installationCompleted: dbRecord.installation_completed || false,
        financialStatus: dbRecord.financial_status || 'pending',
        totalQuoteAmount: dbRecord.total_quote_amount || 0,
        isCancelled: dbRecord.is_cancelled || false,
        isPaused: dbRecord.is_paused || false,

        // 简化关联数据，只使用ID，不依赖JOIN
        currentOwner: {
            name: 'Loading...', // 将通过单独查询获取
            avatar: undefined
        },
        designer: dbRecord.designer_id ? {
            name: 'Loading...', // 将通过单独查询获取
            avatar: undefined
        } : undefined,
        shoppingGuide: dbRecord.shopping_guide_id ? {
            name: 'Loading...', // 将通过单独查询获取
            avatar: undefined
        } : undefined,
        lastStatusChangeBy: dbRecord.last_status_change_by_id ? {
            name: 'Loading...', // 将通过单独查询获取
            avatar: undefined
        } : undefined,
        
        // 报价详情映射 (需要从lead_quote_records表查询)
        quoteDetails: undefined // 将在后续通过单独查询填充
    } as LeadItem
}
const ALLOWED_LEAD_STATUSES = [
    'PENDING_ASSIGNMENT',
    'PENDING_FOLLOW_UP',
    'FOLLOWING_UP',
    'DRAFT_SIGNED',
    'EXPIRED',
    'PENDING_MEASUREMENT',
    'MEASURING_PENDING_ASSIGNMENT',
    'MEASURING_ASSIGNING',
    'MEASURING_PENDING_VISIT',
    'MEASURING_PENDING_CONFIRMATION',
    'PLAN_PENDING_CONFIRMATION',
    'PENDING_PUSH',
    'PENDING_ORDER',
    'IN_PRODUCTION',
    'STOCK_PREPARED',
    'PENDING_SHIPMENT',
    'INSTALLING_PENDING_ASSIGNMENT',
    'INSTALLING_ASSIGNING',
    'INSTALLING_PENDING_VISIT',
    'INSTALLING_PENDING_CONFIRMATION',
    'PENDING_RECONCILIATION',
    'PENDING_INVOICE',
    'PENDING_PAYMENT',
    'COMPLETED',
    'CANCELLED',
    'PAUSED',
    'ABNORMAL'
] as const

const ALLOWED_CUSTOMER_LEVELS = ['A', 'B', 'C', 'D'] as const

const ALLOWED_BUSINESS_TAGS = ['quoted', 'arrived', 'appointment', 'high-intent', 'measured'] as const

function isAllowedLeadStatus(value: string | undefined): value is import('@/types/lead').LeadItem['status'] {
    return !!value && (ALLOWED_LEAD_STATUSES as readonly string[]).includes(value)
}

function normalizeLeadStatus(input: string | undefined): import('@/types/lead').LeadItem['status'] {
    if (isAllowedLeadStatus(input)) return input
    const s = (input || '').toUpperCase()
    if (s === 'NEW') return 'PENDING_ASSIGNMENT'
    if (s === 'CLOSED') return 'EXPIRED'
    if (s === 'CANCELLED' || s === 'CANCELED') return 'CANCELLED'
    if (s === 'PAUSED') return 'PAUSED'
    return 'PENDING_ASSIGNMENT'
}

function normalizeCustomerLevel(input: string | undefined): import('@/types/lead').LeadItem['customerLevel'] {
    const upper = (input || '').toUpperCase()
    return ((ALLOWED_CUSTOMER_LEVELS as readonly string[]).includes(upper) ? upper : 'C') as import('@/types/lead').LeadItem['customerLevel']
}

function normalizeBusinessTags(input: string[] | undefined): import('@/types/lead').LeadItem['businessTags'] {
    const tags = input || []
    return tags.filter(t => (ALLOWED_BUSINESS_TAGS as readonly string[]).includes(t)) as import('@/types/lead').LeadItem['businessTags']
}
