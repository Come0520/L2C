import { ApiError } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/client';

export const assignmentService = {
    /**
     * Re-assign a Lead to a different user.
     * Requires ADMIN or MANAGER role.
     */
    async reassignLead(leadId: string, assigneeId: string, reason?: string) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new ApiError('User not authenticated', 'UNAUTHORIZED', 401);
        const res = await fetch('/api/assignment/reassign', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ resourceType: 'lead', resourceId: leadId, assigneeId, reason })
        })
        if (!res.ok) throw new ApiError(await res.text(), 'ASSIGNMENT_FAILED', res.status)
    },

    /**
     * Re-assign an Order to a different sales person.
     * Requires ADMIN or MANAGER role.
     */
    async reassignOrder(orderId: string, assigneeId: string, reason?: string) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new ApiError('User not authenticated', 'UNAUTHORIZED', 401);
        const res = await fetch('/api/assignment/reassign', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ resourceType: 'order', resourceId: orderId, assigneeId, reason })
        })
        if (!res.ok) throw new ApiError(await res.text(), 'ASSIGNMENT_FAILED', res.status)
    }
};
