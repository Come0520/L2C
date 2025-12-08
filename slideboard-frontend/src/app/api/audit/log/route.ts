import { NextRequest, NextResponse } from 'next/server'

import { auditService } from '@/lib/audit'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { action, entityType, entityId, details } = body

        await auditService.log({
            userId: user.id,
            action,
            entityType,
            entityId,
            details,
            ipAddress: request.headers.get('x-forwarded-for') || undefined
        })

        return NextResponse.json({ success: true })
    } catch (_error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
