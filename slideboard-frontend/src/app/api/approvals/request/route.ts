import { NextRequest, NextResponse } from 'next/server'

import { approvalService } from '@/lib/approval'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { flowId, entityType, entityId } = body

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
