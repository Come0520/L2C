'use client'

import { useState, useEffect } from 'react'

import { PaperButton } from '@/components/ui/paper-button'
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card'
import { PaperInput } from '@/components/ui/paper-input'
import { createClient } from '@/lib/supabase/client'

// Types
interface ApprovalFlow {
    id: string
    name: string
    approval_steps: ApprovalStep[]
}

interface ApprovalStep {
    id: string
    step_order: number
    approver_role: string
    approval_timeout_config: ApprovalTimeoutConfig | null
}

interface ApprovalTimeoutConfig {
    id?: string
    step_id: string
    timeout_hours: number
    action: 'auto_approve' | 'auto_reject' | 'escalate'
    escalate_to_role?: string
}

export function ApprovalConfig() {
    const [flows, setFlows] = useState<ApprovalFlow[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const { data, error } = await supabase
            .from('approval_flows')
            .select(`
                id, name,
                approval_steps (
                    id, step_order, approver_role,
                    approval_timeout_config (
                        id, step_id, timeout_hours, action, escalate_to_role
                    )
                )
            `)
            .order('name')
        
        if (error) {
            console.error('Error loading flows:', error)
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formatted = data?.map((flow: any) => ({
                ...flow,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                approval_steps: flow.approval_steps.map((step: any) => ({
                    ...step,
                    approval_timeout_config: step.approval_timeout_config?.[0] || null
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                })).sort((a: any, b: any) => a.step_order - b.step_order)
            }))
            setFlows(formatted || [])
        }
        setLoading(false)
    }

    async function handleSaveConfig(stepId: string, config: ApprovalTimeoutConfig) {
        // Upsert logic
        const payload = {
            step_id: stepId,
            timeout_hours: Number(config.timeout_hours),
            action: config.action,
            escalate_to_role: config.escalate_to_role
        }
        
        const { error } = await supabase
            .from('approval_timeout_config' as any)
            .upsert(payload, { onConflict: 'step_id' })

        if (error) {
            alert('Failed to save: ' + error.message)
        } else {
            alert('Saved successfully')
            loadData()
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            {flows.map(flow => (
                <PaperCard key={flow.id}>
                    <PaperCardHeader>
                        <PaperCardTitle>{flow.name}</PaperCardTitle>
                    </PaperCardHeader>
                    <PaperCardContent>
                        <div className="space-y-4">
                            {flow.approval_steps.map(step => (
                                <StepConfigRow 
                                    key={step.id} 
                                    step={step} 
                                    onSave={(config) => handleSaveConfig(step.id, config)} 
                                />
                            ))}
                        </div>
                    </PaperCardContent>
                </PaperCard>
            ))}
            {flows.length === 0 && <div>No approval flows found.</div>}
        </div>
    )
}

function StepConfigRow({ step, onSave }: { step: ApprovalStep, onSave: (config: ApprovalTimeoutConfig) => void }) {
    const [config, setConfig] = useState<ApprovalTimeoutConfig>(
        step.approval_timeout_config || {
            step_id: step.id,
            timeout_hours: 24,
            action: 'auto_reject',
            escalate_to_role: ''
        }
    )

    return (
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border rounded bg-gray-50">
            <div className="w-20 font-medium">Step {step.step_order}</div>
            <div className="w-32 text-sm text-gray-500">{step.approver_role || 'No Role'}</div>
            
            <div className="flex items-center gap-2">
                <span className="text-sm">Timeout:</span>
                <PaperInput 
                    type="number" 
                    className="w-20 h-8" 
                    value={config.timeout_hours} 
                    onChange={e => setConfig({...config, timeout_hours: Number(e.target.value)})}
                />
                <span className="text-sm">hours</span>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm">Action:</span>
                <select 
                    className="h-8 border rounded px-2 text-sm bg-white"
                    value={config.action}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onChange={e => setConfig({...config, action: e.target.value as any})}
                >
                    <option value="auto_approve">Auto Approve</option>
                    <option value="auto_reject">Auto Reject</option>
                    <option value="escalate">Escalate</option>
                </select>
            </div>

            {config.action === 'escalate' && (
                <div className="flex items-center gap-2">
                    <span className="text-sm">To Role:</span>
                    <PaperInput 
                        className="w-32 h-8"
                        value={config.escalate_to_role || ''}
                        onChange={e => setConfig({...config, escalate_to_role: e.target.value})}
                        placeholder="e.g. director"
                    />
                </div>
            )}

            <div className="ml-auto">
                <PaperButton size="sm" onClick={() => onSave(config)}>Save</PaperButton>
            </div>
        </div>
    )
}
