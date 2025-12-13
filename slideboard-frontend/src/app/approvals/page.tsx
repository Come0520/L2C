import { ApprovalInbox } from '@/components/approval/approval-inbox'

export default function ApprovalsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Approval Inbox</h1>
                <p className="mt-1 text-sm text-gray-500">Manage your pending approval requests.</p>
            </div>
            <ApprovalInbox />
        </div>
    )
}
