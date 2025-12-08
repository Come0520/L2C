import { NextRequest, NextResponse } from 'next/server'

import { approvalService } from '@/lib/approval'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { action, comment } = body
        const { id: requestId } = await params

        let result
        if (action === 'approve') {
            result = await approvalService.approveRequest(requestId, user.id, comment)
        } else if (action === 'reject') {
            result = await approvalService.rejectRequest(requestId, user.id, comment)
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        return NextResponse.json(result)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
