import { createClient } from '@/lib/supabase/client';
import { 
    CoefficientRule,
    CoefficientApproval,
    CreateCoefficientRuleParams,
    CreateApprovalParams,
    ApproveParams
} from '@/shared/types/points';

/**
 * 积分系数管理服务
 */
export const coefficientService = {
    // ============================================
    // 系数规则管理
    // ============================================

    /**
     * 获取系数规则列表
     */
    async getRules(status?: string): Promise<CoefficientRule[]> {
        const supabase = createClient();

        let query = supabase
            .from('points_coefficient_rules')
            .select('*');

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []) as any[];
    },

    /**
     * 获取我创建的规则(销售负责人)
     */
    async getMyRules(): Promise<CoefficientRule[]> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return [];

        const { data, error } = await supabase
            .from('points_coefficient_rules')
            .select('*')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []) as any[];
    },

    /**
     * 根据ID获取规则详情
     */
    async getRuleById(id: string): Promise<CoefficientRule | null> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('points_coefficient_rules')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data as any;
    },

    /**
     * 创建系数规则
     */
    async createRule(params: CreateCoefficientRuleParams): Promise<CoefficientRule> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('User not authenticated');
        }

        const ruleCode = `COEF_${Date.now()}`;

        const { data, error } = await supabase
            .from('points_coefficient_rules')
            .insert({
                rule_code: ruleCode,
                ...params,
                created_by: user.id,
                status: 'draft'
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data as any;
    },

    /**
     * 更新规则(仅限草稿状态)
     */
    async updateRule(id: string, params: Partial<CreateCoefficientRuleParams>): Promise<CoefficientRule> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('points_coefficient_rules')
            .update(params)
            .eq('id', id)
            .eq('status', 'draft')
            .select()
            .single();

        if (error) {
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data as any;
    },

    /**
     * 删除规则(仅限草稿状态)
     */
    async deleteRule(id: string): Promise<void> {
        const supabase = createClient();

        const { error } = await supabase
            .from('points_coefficient_rules')
            .delete()
            .eq('id', id)
            .eq('status', 'draft');

        if (error) {
            throw error;
        }
    },

    // ============================================
    // 审批管理
    // ============================================

    /**
     * 创建审批单
     */
    async createApproval(params: CreateApprovalParams): Promise<CoefficientApproval> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('User not authenticated');
        }

        const approvalNo = `PCA${Date.now()}`;

        // 更新规则状态为pending_approval
        await supabase
            .from('points_coefficient_rules')
            .update({ status: 'pending_approval' })
            .in('id', params.rule_ids);

        // 创建审批单
        const { data, error } = await supabase
            .from('points_coefficient_approvals')
            .insert({
                approval_no: approvalNo,
                ...params,
                submitted_by: user.id,
                status: 'pending_channel'
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data as any;
    },

    /**
     * 获取我的审批单
     */
    async getMyApprovals(): Promise<CoefficientApproval[]> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return [];

        const { data, error } = await supabase
            .from('points_coefficient_approvals')
            .select('*')
            .eq('submitted_by', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []) as any[];
    },

    /**
     * 获取待我审批的(渠道负责人)
     */
    async getPendingChannelApprovals(): Promise<CoefficientApproval[]> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('points_coefficient_approvals')
            .select('*')
            .eq('status', 'pending_channel')
            .order('submitted_at', { ascending: true });

        if (error) {
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []) as any[];
    },

    /**
     * 获取待终审的(领导)
     */
    async getPendingLeaderApprovals(): Promise<CoefficientApproval[]> {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('points_coefficient_approvals')
            .select('*')
            .eq('status', 'pending_leader')
            .order('channel_approved_at', { ascending: true });

        if (error) {
            throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []) as any[];
    },

    /**
     * 渠道负责人审批
     */
    async channelApprove(params: ApproveParams): Promise<void> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('User not authenticated');
        }

        const updateData: any = {
            channel_approver_id: user.id,
            channel_approval_status: params.approved ? 'approved' : 'rejected',
            channel_approval_comment: params.comment,
            channel_approved_at: new Date().toISOString()
        };

        if (params.approved) {
            // 批准:进入下一级
            updateData.status = 'pending_leader';
        } else {
            // 拒绝:结束流程
            updateData.status = 'rejected';
            updateData.final_status = 'rejected';
        }

        const { error } = await supabase
            .from('points_coefficient_approvals')
            .update(updateData)
            .eq('id', params.approval_id)
            .eq('status', 'pending_channel');

        if (error) {
            throw error;
        }

        // 如果拒绝,更新规则状态
        if (!params.approved) {
            const { data: approval } = await supabase
                .from('points_coefficient_approvals')
                .select('rule_ids')
                .eq('id', params.approval_id)
                .single();

            if (approval) {
                await supabase
                    .from('points_coefficient_rules')
                    .update({ status: 'rejected' })
                    .in('id', approval.rule_ids);
            }
        }
    },

    /**
     * 领导终审
     */
    async leaderApprove(params: ApproveParams): Promise<void> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('User not authenticated');
        }

        const updateData: any = {
            leader_approver_id: user.id,
            leader_approval_status: params.approved ? 'approved' : 'rejected',
            leader_approval_comment: params.comment,
            leader_approved_at: new Date().toISOString(),
            status: params.approved ? 'approved' : 'rejected',
            final_status: params.approved ? 'approved' : 'rejected',
            final_approved_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('points_coefficient_approvals')
            .update(updateData)
            .eq('id', params.approval_id)
            .eq('status', 'pending_leader');

        if (error) {
            throw error;
        }

        // 更新规则状态
        const { data: approval } = await supabase
            .from('points_coefficient_approvals')
            .select('rule_ids')
            .eq('id', params.approval_id)
            .single();

        if (approval) {
            const ruleStatus = params.approved ? 'approved' : 'rejected';
            await supabase
                .from('points_coefficient_rules')
                .update({ 
                    status: ruleStatus,
                    approval_id: params.approval_id,
                    approved_by: user.id,
                    approved_at: new Date().toISOString()
                })
                .in('id', approval.rule_ids);
        }
    },

    /**
     * 撤销审批单(仅限发起人)
     */
    async cancelApproval(approvalId: string): Promise<void> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('User not authenticated');
        }

        const { error } = await supabase
            .from('points_coefficient_approvals')
            .update({ status: 'cancelled' })
            .eq('id', approvalId)
            .eq('submitted_by', user.id);

        if (error) {
            throw error;
        }

        // 恢复规则状态为草稿
        const { data: approval } = await supabase
            .from('points_coefficient_approvals')
            .select('rule_ids')
            .eq('id', approvalId)
            .single();

        if (approval) {
            await supabase
                .from('points_coefficient_rules')
                .update({ status: 'draft' })
                .in('id', approval.rule_ids);
        }
    }
};
