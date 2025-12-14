'use client';

import { LayoutDashboard, Network, Clock } from 'lucide-react';
import { useState } from 'react';

import { ApprovalConfig } from '@/features/system/components/workflow/ApprovalConfig';
import { StatusList } from '@/features/system/components/workflow/StatusList';
import { TransitionManagement } from '@/features/system/components/workflow/TransitionManagement';

export default function WorkflowAdminPage() {
    const [activeTab, setActiveTab] = useState<'statuses' | 'transitions' | 'approvals'>('statuses');

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Workflow Configuration</h1>
                <p className="mt-2 text-gray-600">Manage order statuses, transition rules, and approval timeouts.</p>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('statuses')}
                            className={`
                                w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2
                                ${activeTab === 'statuses'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Status Definitions
                        </button>
                        <button
                            onClick={() => setActiveTab('transitions')}
                            className={`
                                w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2
                                ${activeTab === 'transitions'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                        >
                            <Network className="w-4 h-4" />
                            Transition Rules
                        </button>
                        <button
                            onClick={() => setActiveTab('approvals')}
                            className={`
                                w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2
                                ${activeTab === 'approvals'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                        >
                            <Clock className="w-4 h-4" />
                            Approval Config
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'statuses' && <StatusList />}
                    {activeTab === 'transitions' && <TransitionManagement />}
                    {activeTab === 'approvals' && <ApprovalConfig />}
                </div>
            </div>
        </div>
    );
}
