import { NextResponse } from 'next/server'

import { approvalService } from '@/lib/approval'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const data = await approvalService.getPendingRequests()
        return NextResponse.json({ data })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
