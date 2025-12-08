'use client'

import { useSearchParams } from 'next/navigation'
import React, { Suspense, useEffect } from 'react'

import DashboardLayout from '@/components/layout/dashboard-layout'
import { OrderCreateView } from '@/features/orders/components/order-create-view'
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
        <DashboardLayout>
            <Suspense fallback={<div>Loading...</div>}>
                <OrderCreatePageContent />
            </Suspense>
        </DashboardLayout>
    )
}
