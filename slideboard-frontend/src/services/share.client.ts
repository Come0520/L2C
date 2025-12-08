export interface ShareValidationResult {
    resourceType: 'quote' | 'order';
    resource: any;
}

export interface ShareToken {
    id: string;
    resourceType: 'quote' | 'order';
    resourceId: string;
    token: string;
    expiresAt: string | null;
    isActive: boolean;
    createdAt: string;
}

const mapDbTokenToShareToken = (row: any): ShareToken => ({
    id: row.id,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    token: row.token,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    createdAt: row.created_at,
})

export const shareService = {
    /**
     * Generate a new share token for a resource
     */
    async generateToken(resourceType: 'quote' | 'order', resourceId: string, expiresInDays: number = 7) {
        const res = await fetch('/api/sharing/tokens', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ resourceType, resourceId, expiresInDays }),
        })
        if (!res.ok) throw new Error('Failed to generate token')
        const json = await res.json()
        return mapDbTokenToShareToken(json.token)
    },

    /**
     * Get active token for a resource (if exists)
     */
    async getActiveToken(resourceType: 'quote' | 'order', resourceId: string) {
        const url = new URL('/api/sharing/tokens', window.location.origin)
        url.searchParams.set('resourceType', resourceType)
        url.searchParams.set('resourceId', resourceId)
        const res = await fetch(url.toString(), { method: 'GET' })
        if (!res.ok) throw new Error('Failed to get active token')
        const json = await res.json()
        return json.token ? mapDbTokenToShareToken(json.token) : null
    },

    /**
     * Validate a token and return the resource info
     */
    async validateToken(token: string): Promise<ShareValidationResult> {
        const url = new URL('/api/sharing/validate', window.location.origin)
        url.searchParams.set('token', token)
        const res = await fetch(url.toString(), { method: 'GET' })
        if (!res.ok) throw new Error('Invalid or expired token')
        const json = await res.json()
        return { resourceType: json.resourceType, resource: json.resource }
    },

    /**
     * Revoke a token
     */
    async revokeToken(tokenId: string) {
        const res = await fetch(`/api/sharing/tokens/${tokenId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to revoke token')
    }
};
