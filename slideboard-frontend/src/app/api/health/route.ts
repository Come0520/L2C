import { NextResponse } from 'next/server'

import { withApiHandler, createSuccessResponse } from '@/utils/api-error-handler'

export const GET = withApiHandler(async () => {
  return createSuccessResponse({ status: 'ok' })
})

