
export class AppError extends Error {
    public code: string;
    public statusCode: number;
    public details?: unknown;

    constructor(message: string, code: string, statusCode: number = 400, details?: unknown) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;

        // Maintain proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }
}

export const ERROR_CODES = {
    CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND', // 404
    PERMISSION_DENIED: 'PERMISSION_DENIED',   // 403
    CONCURRENCY_CONFLICT: 'CONCURRENCY_CONFLICT', // 409
    INVALID_OPERATION: 'INVALID_OPERATION',   // 400
    INTERNAL_ERROR: 'INTERNAL_ERROR',         // 500
    VALIDATION_ERROR: 'VALIDATION_ERROR',     // 400
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
