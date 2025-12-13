'use client';

import { Pencil, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';

import { useWorkflow, WorkflowDefinition } from '@/hooks/useWorkflow';

export function StatusList() {
    const { config, loading, error } = useWorkflow();
    const [isEditing, setIsEditing] = useState(false);
    const [editItem, setEditItem] = useState<Partial<WorkflowDefinition> | null>(null);

    if (loading) return <div>Loading statuses...</div>;
    if (error) return <div className="text-red-500">Error: {error}</div>;

    const definitions = config?.definitions || [];

    const handleEdit = (def: WorkflowDefinition) => {
        setEditItem(def);
        setIsEditing(true);
    };

    const handleCreate = () => {
        setEditItem({
            code: '',
            name: '',
            category: 'ORDER', // Default
            order_index: definitions.length + 1,
            color: '#000000',
            description: '',
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editItem) return;

        try {
            const res = await fetch('/api/workflow/definitions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editItem),
            });
            if (!res.ok) throw new Error('Failed to save');

            // Reload page or re-fetch (simple reload for now or invalidate cache logic)
            window.location.reload();
        } catch (err) {
            alert('Failed to save status');
            console.error(err);
        }
    };

    const handleDelete = async (code: string) => {
        if (!confirm(`Are you sure you want to delete status "${code}"?`)) return;

        try {
            const res = await fetch(`/api/workflow/definitions?code=${code}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
            window.location.reload();
        } catch (err: unknown) {
            if (err instanceof Error) {
                alert(err.message);
            } else {
                alert('An unknown error occurred');
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Status Definitions</h3>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Status
                </button>
            </div>

            <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {definitions.map((def) => (
                            <tr key={def.code}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{def.order_index}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{def.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{def.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${def.category === 'LEAD' ? 'bg-blue-100 text-blue-800' :
                                            def.category === 'ORDER' ? 'bg-green-100 text-green-800' :
                                                def.category === 'FINANCE' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'}`}>
                                        {def.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: def.color }}></div>
                                        {def.color}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(def)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(def.code)} className="text-red-600 hover:text-red-900">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Simple Inline Modal for Edit/Create */}
            {isEditing && editItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
                        <h4 className="text-lg font-bold">{editItem.code ? 'Edit Status' : 'Create Status'}</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Code</label>
                                <input
                                    type="text"
                                    value={editItem.code}
                                    disabled={!!editItem.code && definitions.some(d => d.code === editItem.code && d !== editItem)} // Lock code on edit if it existed (though logic allows changing PK, upsert handles it as new insert if changed)
                                    // Actually PK change is tricky. Let's allow editing everything for Upsert logic, but usually PK shouldn't change. 
                                    // For simplicity, allow editing all.
                                    onChange={e => setEditItem({ ...editItem, code: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={editItem.name}
                                    onChange={e => setEditItem({ ...editItem, name: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <select
                                    value={editItem.category}
                                    onChange={e => setEditItem({ ...editItem, category: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                >
                                    <option value="LEAD">LEAD</option>
                                    <option value="ORDER">ORDER</option>
                                    <option value="FINANCE">FINANCE</option>
                                    <option value="EXCEPTION">EXCEPTION</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                                <input
                                    type="number"
                                    value={editItem.order_index}
                                    onChange={e => setEditItem({ ...editItem, order_index: parseInt(e.target.value) })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Color</label>
                                <input
                                    type="color"
                                    value={editItem.color}
                                    onChange={e => setEditItem({ ...editItem, color: e.target.value })}
                                    className="mt-1 block w-full h-10 border border-gray-300 rounded-md shadow-sm p-1"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
