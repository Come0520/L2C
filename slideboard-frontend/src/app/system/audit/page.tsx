import { AuditLogViewer } from '@/components/audit/audit-log-viewer'

export default function AuditPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
                <p className="mt-1 text-sm text-gray-500">View all system activities and security events.</p>
            </div>
            <AuditLogViewer />
        </div>
    )
}
