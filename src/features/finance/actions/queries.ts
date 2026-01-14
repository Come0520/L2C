'use server';
// Mock Finance Queries
export async function getPayments(params: any) { return { data: [] }; }
export async function getPayment(id: string) { return { data: null }; }
