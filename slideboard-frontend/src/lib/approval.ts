import { createClient } from '@/lib/supabase/server'

export interface CreateApprovalRequestParams {
    flowId: string
    requesterId: string
    entityType: string
    entityId: string
    timeoutMinutes?: number
    autoEscalate?: boolean
}

export const approvalService = {
    async createRequest(params: CreateApprovalRequestParams) {
        const supabase = await createClient()
        
        // 获取审批流程配置，包括默认超时时间
        const { data: flowData, error: flowError } = await supabase
            .from('approval_flows')
            .select('default_timeout_minutes, auto_escalate')
            .eq('id', params.flowId)
            .single()
        
        if (flowError) throw flowError
        
        // 设置超时时间，优先使用请求参数，否则使用流程默认值
        const timeoutMinutes = params.timeoutMinutes ?? flowData.default_timeout_minutes ?? 24 * 60 // 默认24小时
        const autoEscalate = params.autoEscalate ?? flowData.auto_escalate ?? true
        
        // 计算超时时间
        const dueAt = new Date()
        dueAt.setMinutes(dueAt.getMinutes() + timeoutMinutes)

        const { data, error } = await supabase
            .from('approval_requests')
            .insert({
                flow_id: params.flowId,
                requester_id: params.requesterId,
                entity_type: params.entityType,
                entity_id: params.entityId,
                status: 'pending',
                current_step_order: 1,
                due_at: dueAt.toISOString(),
                auto_escalate: autoEscalate,
                timeout_minutes: timeoutMinutes
            })
            .select()
            .single()

        if (error) throw error
        return data
    },

    async getPendingRequests() {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('approval_requests')
            .select(`
        *,
        flow:approval_flows(name),
        requester:users(name)
      `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    },

    async approveRequest(requestId: string, actorId: string, comment?: string) {
        const supabase = await createClient()

        // 1. Get request to check current step
        const { data: request, error: reqError } = await supabase
            .from('approval_requests')
            .select('*, flow:approval_flows(*)')
            .eq('id', requestId)
            .single()

        if (reqError || !request) throw new Error('Request not found')

        // 2. Log action
        await supabase.from('approval_actions').insert({
            request_id: requestId,
            step_order: request.current_step_order,
            actor_id: actorId,
            action: 'approve',
            comment
        })

        // 3. Check if this is the final step
        // We need to fetch steps for this flow
        const { data: steps } = await supabase
            .from('approval_steps')
            .select('*')
            .eq('flow_id', request.flow_id)
            .order('step_order', { ascending: true })

        if (!steps) throw new Error('No steps found for flow')

        const currentStepIndex = steps.findIndex(s => s.step_order === request.current_step_order)
        const isLastStep = currentStepIndex === steps.length - 1

        if (isLastStep) {
            // Final approval
            await supabase
                .from('approval_requests')
                .update({ status: 'approved', updated_at: new Date().toISOString() })
                .eq('id', requestId)

            // Notify requester
            if (request.requester_id && request.requester_id !== actorId) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const flowName = (request.flow as any)?.name
                await supabase.from('notifications').insert({
                    user_id: request.requester_id,
                    title: '审批通过',
                    content: `您的审批请求 "${flowName || '未知'}" 已通过。`,
                    type: 'success',
                    related_entity_type: 'approval',
                    related_entity_id: requestId
                })
            }

            return { status: 'approved' }
        } else {
            // Move to next step
            const nextStep = steps[currentStepIndex + 1]
            if (!nextStep) throw new Error('下一步骤未找到')

            await supabase
                .from('approval_requests')
                .update({
                    current_step_order: nextStep.step_order,
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId)

            if (steps && steps.length > 0) {
                // const nextStep = steps[currentStepIndex + 1]
                // Notification for next approver? (Simulated for now as we don't have step-approver mapping easily)
            }

            return { status: 'pending', nextStep: steps ? steps[currentStepIndex + 1]?.step_order : 0 }
        }
    },

    async rejectRequest(requestId: string, actorId: string, comment?: string) {
        const supabase = await createClient()

        // 1. Get request
        const { data: request, error: reqError } = await supabase
            .from('approval_requests')
            .select('current_step_order, requester_id, flow:approval_flows(name)')
            .eq('id', requestId)
            .single()

        if (reqError || !request) throw new Error('Request not found')

        // 2. Log action
        await supabase.from('approval_actions').insert({
            request_id: requestId,
            step_order: request.current_step_order,
            actor_id: actorId,
            action: 'reject',
            comment
        })

        // 3. Update status
        await supabase
            .from('approval_requests')
            .update({ status: 'rejected', updated_at: new Date().toISOString() })
            .eq('id', requestId)

        // 4. Notify requester
        if (request.requester_id && request.requester_id !== actorId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const flowName = (request.flow as any)?.name
            await supabase.from('notifications').insert({
                user_id: request.requester_id,
                title: '审批拒绝',
                content: `您的审批请求 "${flowName || '未知'}" 已被拒绝。${comment ? `理由: ${comment}` : ''}`,
                type: 'error',
                related_entity_type: 'approval',
                related_entity_id: requestId
            })
        }

        return { status: 'rejected' }
    }
}

