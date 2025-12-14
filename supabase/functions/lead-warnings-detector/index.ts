import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Warning {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    lead_id?: string;
    order_id?: string;
    message: string;
    action_required: string;
    metadata?: Record<string, any>;
}

serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseKey);

        const warnings: Warning[] = [];

        // 1. 检测高意向无跟进（评分>80且3天内无跟进）
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const { data: highIntentLeads } = await supabase
            .from('leads')
            .select('id, name, score, last_follow_up_at')
            .gte('score', 80)
            .lt('last_follow_up_at', threeDaysAgo)
            .is('deleted_at', null);

        for (const lead of highIntentLeads || []) {
            const daysSince = Math.floor(
                (Date.now() - new Date(lead.last_follow_up_at).getTime()) / (1000 * 60 * 60 * 24)
            );
            warnings.push({
                type: 'HIGH_INTENT_NO_FOLLOW_UP',
                severity: 'critical',
                lead_id: lead.id,
                message: `线索「${lead.name}」评分 ${lead.score}，但已 ${daysSince} 天无跟进记录`,
                action_required: '立即安排跟进',
                metadata: { score: lead.score, days_since_follow_up: daysSince },
            });
        }

        // 2. 检测待分配超时（状态为待分配且超过24小时）
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: pendingLeads } = await supabase
            .from('leads')
            .select('id, name, created_at')
            .eq('status', 'PENDING_ASSIGNMENT')
            .lt('created_at', oneDayAgo)
            .is('deleted_at', null);

        for (const lead of pendingLeads || []) {
            const hoursSince = Math.floor(
                (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60)
            );
            warnings.push({
                type: 'TIMEOUT_ASSIGNMENT',
                severity: 'high',
                lead_id: lead.id,
                message: `线索「${lead.name}」待分配已超过 ${hoursSince} 小时`,
                action_required: '尽快分配给销售人员',
                metadata: { hours_since_created: hoursSince },
            });
        }

        // 3. 检测待跟踪超时（状态为待跟踪且超过48小时）
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data: pendingFollowUp } = await supabase
            .from('leads')
            .select('id, name, updated_at')
            .eq('status', 'PENDING_FOLLOW_UP')
            .lt('updated_at', twoDaysAgo)
            .is('deleted_at', null);

        for (const lead of pendingFollowUp || []) {
            warnings.push({
                type: 'TIMEOUT_FOLLOW_UP',
                severity: 'high',
                lead_id: lead.id,
                message: `线索「${lead.name}」待跟踪超过 48 小时`,
                action_required: '立即跟进',
            });
        }

        // 4. 检测长期未更新（跟进中但7天无更新）
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: staleLeads } = await supabase
            .from('leads')
            .select('id, name, updated_at')
            .eq('status', 'FOLLOWING_UP')
            .lt('updated_at', sevenDaysAgo)
            .is('deleted_at', null);

        for (const lead of staleLeads || []) {
            warnings.push({
                type: 'TIMEOUT_LONG_NO_UPDATE',
                severity: 'medium',
                lead_id: lead.id,
                message: `线索「${lead.name}」7 天内无更新`,
                action_required: '检查跟进进度',
            });
        }

        // 5. 检测预算超支（订单金额>预算120%）
        const { data: orders } = await supabase
            .from('orders')
            .select('id, order_number, budget_max, actual_amount, lead_id')
            .not('budget_max', 'is', null)
            .not('actual_amount', 'is', null);

        for (const order of orders || []) {
            const overrunPercentage = (order.actual_amount / order.budget_max) * 100;
            if (overrunPercentage > 120) {
                warnings.push({
                    type: 'BUDGET_OVERRUN',
                    severity: 'medium',
                    order_id: order.id,
                    lead_id: order.lead_id,
                    message: `订单「${order.order_number}」实际金额 ¥${order.actual_amount.toLocaleString()}，超出预算 ${(overrunPercentage - 100).toFixed(1)}%`,
                    action_required: '与客户确认调整方案',
                    metadata: {
                        budget: order.budget_max,
                        actual: order.actual_amount,
                        overrun_percentage: overrunPercentage.toFixed(1)
                    },
                });
            }
        }

        // 6. 检测流失风险（30天无互动）
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: churnRiskLeads } = await supabase
            .from('leads')
            .select('id, name, last_interaction_at')
            .lt('last_interaction_at', thirtyDaysAgo)
            .in('status', ['FOLLOWING_UP', 'DRAFT_SIGNED'])
            .is('deleted_at', null);

        for (const lead of churnRiskLeads || []) {
            const daysSince = Math.floor(
                (Date.now() - new Date(lead.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24)
            );
            warnings.push({
                type: 'CHURN_RISK',
                severity: 'medium',
                lead_id: lead.id,
                message: `客户「${lead.name}」已 ${daysSince} 天无互动`,
                action_required: '主动联系客户，了解需求',
                metadata: { days_since_interaction: daysSince },
            });
        }

        // 7. 检测竞品威胁（备注包含竞品关键词）
        const competitorKeywords = ['摩力克', '欧尚', '金蝉', '美居乐', '如鱼得水', '价格更低', '去看看别家'];
        const { data: allLeads } = await supabase
            .from('leads')
            .select('id, name, notes, remarks')
            .is('deleted_at', null);

        for (const lead of allLeads || []) {
            const text = `${lead.notes || ''} ${lead.remarks || ''}`.toLowerCase();
            const foundKeywords = competitorKeywords.filter(keyword =>
                text.includes(keyword.toLowerCase())
            );

            if (foundKeywords.length > 0) {
                warnings.push({
                    type: 'COMPETITOR_THREAT',
                    severity: 'high',
                    lead_id: lead.id,
                    message: `线索「${lead.name}」备注中提到竞品：${foundKeywords.join('、')}`,
                    action_required: '准备竞品对比资料，突出优势',
                    metadata: { detected_keywords: foundKeywords },
                });
            }
        }

        // 8. 检测待测量超时（待测量订单超过48小时）
        const { data: pendingMeasurement } = await supabase
            .from('orders')
            .select('id, order_number, lead_id, updated_at')
            .eq('status', 'PENDING_MEASUREMENT')
            .lt('updated_at', twoDaysAgo);

        for (const order of pendingMeasurement || []) {
            warnings.push({
                type: 'TIMEOUT_MEASUREMENT',
                severity: 'high',
                order_id: order.id,
                lead_id: order.lead_id,
                message: `订单「${order.order_number}」待测量超过 48 小时`,
                action_required: '安排测量人员',
            });
        }

        // 批量插入预警记录（去重，避免重复创建）
        if (warnings.length > 0) {
            const { error } = await supabase
                .from('warnings')
                .upsert(warnings.map(w => ({
                    ...w,
                    created_at: new Date().toISOString(),
                    resolved_at: null,
                })), {
                    onConflict: 'type,lead_id',
                    ignoreDuplicates: false,
                });

            if (error) {
                console.error('Failed to insert warnings:', error);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                warnings_created: warnings.length,
                timestamp: new Date().toISOString(),
            }),
            { headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
