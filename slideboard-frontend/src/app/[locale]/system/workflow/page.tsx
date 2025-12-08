'use client';

import { useState } from 'react';
import { StatusList } from '@/features/system/components/workflow/StatusList';
import { TransitionManagement } from '@/features/system/components/workflow/TransitionManagement';
import { LayoutDashboard, Network } from 'lucide-react';

export default function WorkflowAdminPage() {
    const [activeTab, setActiveTab] = useState<'statuses' | 'transitions'>('statuses');

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Workflow Configuration</h1>
                <p className="mt-2 text-gray-600">Manage order statuses and transition rules.</p>
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
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'statuses' ? <StatusList /> : <TransitionManagement />}
                </div>
            </div>
        </div>
    );
}
