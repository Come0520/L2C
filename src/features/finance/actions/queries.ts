'use server';
// Mock Finance Queries
export async function getPayments(_params: any) { return { data: [] }; }
export async function getPayment(_id: string) { return { data: null }; }
