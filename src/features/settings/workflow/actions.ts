'use server';

export async function getWorkflows() {
    return { success: true, data: [] };
}

export async function createWorkflow(data: any) {
    return { success: true, message: 'Workflow created' };
}

export async function updateWorkflow(data: any) {
    return { success: true, message: 'Workflow updated' };
}

export async function deleteWorkflow(id: string) {
    return { success: true, message: 'Workflow deleted' };
}
