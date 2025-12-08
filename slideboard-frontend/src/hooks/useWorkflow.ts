import { useEffect, useState } from 'react';

export interface WorkflowDefinition {
    code: string;
    name: string;
    category: string;
    order_index: number;
    color: string;
    description: string;
}

export interface WorkflowTransitionRule {
    from_status: string;
    to_status: string;
    required_fields: string[] | null;
    required_files: string[] | null;
    required_permissions: string[] | null;
}

export interface WorkflowConfig {
    definitions: WorkflowDefinition[];
    transitions: WorkflowTransitionRule[];
}

// In-memory cache to prevent redundant fetches
let cachedConfig: WorkflowConfig | null = null;

export const useWorkflow = () => {
    const [activeConfig, setActiveConfig] = useState<WorkflowConfig | null>(cachedConfig);
    const [loading, setLoading] = useState(!cachedConfig);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (cachedConfig) return;

        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/workflow/config');
                if (!res.ok) throw new Error('Failed to fetch workflow config');
                const data = await res.json();
                cachedConfig = data;
                setActiveConfig(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load workflow configuration');
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const getNextStatuses = (currentStatus: string): string[] => {
        if (!activeConfig) return [];
        return activeConfig.transitions
            .filter((t) => t.from_status === currentStatus)
            .map((t) => t.to_status);
    };

    const canTransition = (from: string, to: string): boolean => {
        if (!activeConfig) return false;
        return activeConfig.transitions.some(
            (t) => t.from_status === from && t.to_status === to
        );
    };

    const getStatusMetadata = (status: string) => {
        return activeConfig?.definitions.find((d) => d.code === status);
    };

    return {
        config: activeConfig,
        loading,
        error,
        getNextStatuses,
        canTransition,
        getStatusMetadata,
    };
};
