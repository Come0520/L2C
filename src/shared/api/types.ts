// Mock Types for Emergency Recovery
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp?: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
