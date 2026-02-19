import { describe, it, expect, vi } from 'vitest';

vi.mock('@/shared/api/db', () => ({
    db: {},
}));

import { escapeLikePattern } from '../utils';

describe('After Sales Utils', () => {
    describe('escapeLikePattern', () => {
        it('should escape percent sign', () => {
            expect(escapeLikePattern('100%')).toBe('100\\%');
        });

        it('should escape underscore', () => {
            expect(escapeLikePattern('user_name')).toBe('user\\_name');
        });

        it('should escape backslash', () => {
            expect(escapeLikePattern('work\\path')).toBe('work\\\\path');
        });

        it('should not change normal strings', () => {
            expect(escapeLikePattern('normal123')).toBe('normal123');
        });

        it('should handle complex patterns', () => {
            expect(escapeLikePattern('%_\\abc')).toBe('\\%\\_\\\\abc');
        });
    });
});
