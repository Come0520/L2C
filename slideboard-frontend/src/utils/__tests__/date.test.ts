import { formatDateTime, formatRelativeTime } from '../date';

describe('date utility functions', () => {
  describe('formatDateTime', () => {
    const testDate = '2023-10-15T14:30:45';
    const testDateObj = new Date(testDate);

    it('should format date string with default format', () => {
      expect(formatDateTime(testDate)).toBe('2023-10-15 14:30:45');
    });

    it('should format Date object with default format', () => {
      expect(formatDateTime(testDateObj)).toBe('2023-10-15 14:30:45');
    });

    it('should format with custom date-only format', () => {
      expect(formatDateTime(testDate, 'YYYY-MM-DD')).toBe('2023-10-15');
    });

    it('should format with custom time-only format', () => {
      expect(formatDateTime(testDate, 'HH:mm:ss')).toBe('14:30:45');
    });

    it('should format with custom datetime format', () => {
      expect(formatDateTime(testDate, 'YYYY/MM/DD HH:mm')).toBe('2023/10/15 14:30');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDateTime('invalid-date')).toBe('');
    });

    it('should format with single digit values properly', () => {
      const singleDigitDate = '2023-01-05T09:05:03';
      expect(formatDateTime(singleDigitDate)).toBe('2023-01-05 09:05:03');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "刚刚" for time within 60 seconds', () => {
      const recentDate = new Date(Date.now() - 30 * 1000);
      expect(formatRelativeTime(recentDate)).toBe('刚刚');
    });

    it('should return "5分钟前" for time 5 minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5分钟前');
    });

    it('should return "1小时前" for time 1 hour ago', () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneHourAgo)).toBe('1小时前');
    });

    it('should return "3小时前" for time 3 hours ago', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeHoursAgo)).toBe('3小时前');
    });

    it('should return "昨天" for time 1 day ago', () => {
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneDayAgo)).toBe('昨天');
    });

    it('should return "前天" for time 2 days ago', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoDaysAgo)).toBe('前天');
    });

    it('should return "5天前" for time 5 days ago', () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(fiveDaysAgo)).toBe('5天前');
    });

    it('should return "2个月前" for time 2 months ago', () => {
      const twoMonthsAgo = new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoMonthsAgo)).toBe('2个月前');
    });

    it('should return "1年前" for time 1 year ago', () => {
      const oneYearAgo = new Date(Date.now() - 1 * 365 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneYearAgo)).toBe('1年前');
    });

    it('should return "未来时间" for future time', () => {
      const futureDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(futureDate)).toBe('未来时间');
    });

    it('should handle date string input', () => {
      const recentDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(formatRelativeTime(recentDate)).toBe('10分钟前');
    });
  });
});
