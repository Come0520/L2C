import { cn } from './utils';

describe('cn utility function', () => {
  it('should merge multiple class names into a single string', () => {
    expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
  });

  it('should handle empty strings and undefined values', () => {
    expect(cn('class1', '', 'class2', undefined, 'class3')).toBe('class1 class2 class3');
  });

  it('should handle null values', () => {
    expect(cn('class1', null, 'class2')).toBe('class1 class2');
  });

  it('should handle boolean values', () => {
    expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
  });

  it('should handle array values', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
  });

  it('should handle nested arrays', () => {
    expect(cn(['class1', ['class2', 'class3']], 'class4')).toBe('class1 class2 class3 class4');
  });

  it('should handle object values', () => {
    expect(cn({ class1: true, class2: false, class3: true })).toBe('class1 class3');
  });

  it('should handle mixed values', () => {
    expect(cn('class1', { class2: true, class3: false }, ['class4', { class5: true }], 'class6')).toBe('class1 class2 class4 class5 class6');
  });

  it('should merge tailwind classes correctly', () => {
    // Test that conflicting tailwind classes are merged properly
    expect(cn('p-2 p-4')).toBe('p-4');
    expect(cn('bg-red-500 bg-blue-500')).toBe('bg-blue-500');
  });

  it('should return an empty string when no valid classes are provided', () => {
    expect(cn('', null, undefined, false)).toBe('');
  });
});
