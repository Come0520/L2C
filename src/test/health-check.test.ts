import { describe, it, expect } from 'vitest';

describe('Health Check', () => {
    it('should pass a simple truthy test', () => {
        expect(true).toBe(true);
    });

    it('should have access to JSDOM', () => {
        const div = document.createElement('div');
        div.innerHTML = 'Hello Vitest';
        expect(div.innerHTML).toBe('Hello Vitest');
    });
});
