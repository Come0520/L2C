'use client';

import { useState } from 'react';
import { useWorkflow } from '@/hooks/useWorkflow';
import { Check, Loader2 } from 'lucide-react';

export function TransitionManagement() {
    const { config, loading, error } = useWorkflow();
    const [saving, setSaving] = useState(false);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    const definitions = config?.definitions || [];
    const transitions = config?.transitions || [];

    // Separate definitions by category for better visualization if needed, 
    // but for a matrix we need a flat list usually, or grouped headers.
    // Given 29 statuses, a 30x30 matrix is huge. 
    // Let's do a grouped list or a "Source -> Targets" view.
    // "Source -> Targets" is better.

    const toggleTransition = async (from: string, to: string, isActive: boolean) => {
        setSaving(true);
        try {
            if (isActive) {
                // DELETE
                await fetch('/api/workflow/transitions', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ from_status: from, to_status: to }),
                });
            } else {
                // POST (Create)
                await fetch('/api/workflow/transitions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from_status: from,
                        to_status: to,
                        required_fields: [], // Default empty
                        required_files: [],
                        required_permissions: []
                    }),
                });
            }
            // Ideally we re-fetch config here. 
            // Since we don't have a direct refetch exposed from useWorkflow easily without hacking hooks,
            // we will force reload for MVP or just update local state if we had it.
            // A simple reload is safest for data consistency.
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Failed to update transition');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium">Transition Rules</h3>
            <p className="text-sm text-gray-500">Enable transitions between statuses. Green indicates an allowed path.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {definitions.map((fromDef) => {
                    // Find all enabled transitions from this status
                    const activeTransitions = transitions
                        .filter(t => t.from_status === fromDef.code)
                        .map(t => t.to_status);

                    return (
                        <div key={fromDef.code} className="border rounded-lg p-4 bg-white shadow-sm flex flex-col gap-2">
                            <div className="flex items-center gap-2 border-b pb-2 mb-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: fromDef.color }}></div>
                                <span className="font-semibold text-gray-900">{fromDef.name}</span>
                            </div>

                            <div className="text-xs text-gray-500 font-medium uppercase mb-1">Allowed Targets:</div>

                            <div className="space-y-1 max-h-60 overflow-y-auto">
                                {definitions.filter(d => d.code !== fromDef.code).map((toDef) => {
                                    const isAllowed = activeTransitions.includes(toDef.code);
                                    return (
                                        <div
                                            key={toDef.code}
                                            onClick={() => !saving && toggleTransition(fromDef.code, toDef.code, isAllowed)}
                                            className={`
                                                flex items-center justify-between px-2 py-1.5 rounded cursor-pointer text-sm
                                                ${isAllowed ? 'bg-green-50 hover:bg-green-100 border border-green-200' : 'hover:bg-gray-50 border border-transparent'}
                                            `}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: toDef.color }}></div>
                                                <span className={isAllowed ? 'text-gray-900' : 'text-gray-400'}>{toDef.name}</span>
                                            </div>
                                            {isAllowed && <Check className="w-3 h-3 text-green-600" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            {saving && (
                <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                </div>
            )}
        </div>
    );
}
