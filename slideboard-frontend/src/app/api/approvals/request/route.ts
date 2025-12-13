import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { approvalService } from '@/lib/approval'
import { createClient } from '@/lib/supabase/server'

// Validation schema for approval request
const approvalRequestSchema = z.object({
    flowId: z.string().min(1, 'Flow ID is required'),
    entityType: z.string().min(1, 'Entity type is required'),
    entityId: z.string().min(1, 'Entity ID is required')
})

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const validationResult = approvalRequestSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: validationResult.error.format() },
                { status: 400 }
            )
        }

        const { flowId, entityType, entityId } = validationResult.data

        const result = await approvalService.createRequest({
            flowId,
            requesterId: user.id,
            entityType,
            entityId
        })

        return NextResponse.json(result)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
