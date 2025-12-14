'use client'

import { useSearchParams } from 'next/navigation'
import React, { Suspense, useEffect } from 'react'

import { OrderCreateView } from '@/features/orders/components/OrderCreateView'
import { TRACK_PAGE_VIEW } from '@/utils/analytics'

function OrderCreatePageContent() {
    const searchParams = useSearchParams()
    const leadId = searchParams.get('leadId')

    // Track page view
    useEffect(() => {
        TRACK_PAGE_VIEW('orders-create', {
            leadId,
            component: 'OrderCreatePage'
        })
    }, [leadId])

    return <OrderCreateView initialLeadId={leadId} />
}

export default function OrderCreatePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OrderCreatePageContent />
        </Suspense>
    )
}
