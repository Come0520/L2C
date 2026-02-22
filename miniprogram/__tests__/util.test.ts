import { formatTime } from '../utils/util';

describe('utils/util', () => {
    test('formatTime 应能正确格式化日期', () => {
        const date = new Date('2026-02-22T17:40:00');
        // 注意：toLocaleDateString 和这里的拼接可能因为环境时区有差异
        // util.ts 使用的是 getFullYear/getMonth/getDate 等，受本地时区影响
        const formatted = formatTime(date);
        expect(formatted).toMatch(/^2026\/02\/22 17:40:00$/);
    });

    test('formatTime 应处理个位数月份和日期', () => {
        const date = new Date('2026-01-02T03:04:05');
        const formatted = formatTime(date);
        expect(formatted).toBe('2026/01/02 03:04:05');
    });
});
