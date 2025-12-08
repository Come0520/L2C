// API返回的工作流规则类型（蛇形命名）
import { createClient } from '@/lib/supabase/client'

export interface WorkflowRuleFromApi {
  id: string;
  name: string;
  description: string;
  from_status: string;
  to_status: string;
  conditions: string;
  approvers: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 应用中使用的工作流规则类型（驼峰命名）
export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  fromStatus: string;
  toStatus: string;
  conditions: string[];
  approvers: string[];
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

class WorkflowService {
    /**
     * Get all workflow rules
     */
    async getWorkflowRules(): Promise<WorkflowRule[]> {
        const supabase = createClient()
        const { data: rulesData, error: supabaseError } = await supabase
            .from('workflow_rules')
            .select('*')
            .order('name', { ascending: true })
        if (supabaseError) throw new Error(supabaseError.message)
        const parseArray = (val: unknown): string[] => {
            if (!val) return []
            if (Array.isArray(val)) return val as string[]
            try {
                const parsed = JSON.parse(val as string)
                return Array.isArray(parsed) ? parsed : []
            } catch {
                return []
            }
        }
        return (rulesData || []).map((rule: WorkflowRuleFromApi) => ({
            id: rule.id,
            name: rule.name,
            description: rule.description,
            fromStatus: rule.from_status,
            toStatus: rule.to_status,
            conditions: parseArray(rule.conditions),
            approvers: parseArray(rule.approvers),
            isActive: rule.is_active,
            created_at: rule.created_at,
            updated_at: rule.updated_at,
        }))
    }

    /**
     * Create a new workflow rule
     */
    async createWorkflowRule(
        name: string,
        description: string,
        fromStatus: string,
        toStatus: string,
        conditions: string[] = [],
        approvers: string[] = [],
        isActive: boolean = false
    ): Promise<WorkflowRule> {
        const supabase = createClient()
        const { data: ruleData, error: supabaseError } = await supabase
            .from('workflow_rules')
            .insert({
                name,
                description,
                from_status: fromStatus,
                to_status: toStatus,
                conditions: JSON.stringify(conditions || []),
                approvers: JSON.stringify(approvers || []),
                is_active: isActive || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single()
        if (supabaseError) throw new Error(supabaseError.message)
        const parseArray = (val: unknown): string[] => {
            if (!val) return []
            if (Array.isArray(val)) return val as string[]
            try {
                const parsed = JSON.parse(val as string)
                return Array.isArray(parsed) ? parsed : []
            } catch {
                return []
            }
        }
        return {
            id: ruleData.id,
            name: ruleData.name,
            description: ruleData.description,
            fromStatus: ruleData.from_status,
            toStatus: ruleData.to_status,
            conditions: parseArray(ruleData.conditions),
            approvers: parseArray(ruleData.approvers),
            isActive: ruleData.is_active,
            created_at: ruleData.created_at,
            updated_at: ruleData.updated_at,
        }
    }
}

export const WORKFLOW_SERVICE = new WorkflowService();
export const workflowService = WORKFLOW_SERVICE;
