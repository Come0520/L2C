import { createClient } from '@/lib/supabase/server'
import { ApiErrorCode } from '@/types/api'
import { withApiHandler, ApiError } from '@/utils/api-error-handler'

export const GET = withApiHandler(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new ApiError(
            ApiErrorCode.UNAUTHORIZED,
            'Unauthorized',
            401
        )
    }

    const { data, error } = await supabase
        .from('approval_flows')
        .select('*')
        .eq('is_active', true)

    if (error) throw error
    return data
})

