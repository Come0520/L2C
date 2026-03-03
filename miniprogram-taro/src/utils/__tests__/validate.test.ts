import { isValidPhone, isNotEmpty, isValidLength, isValidEmail } from '../validate'

describe('validate tools', () => {
    describe('isValidPhone', () => {
        it('should return true for valid phone numbers', () => {
            expect(isValidPhone('13800138000')).toBe(true)
        })
        it('should return false for invalid phone numbers (10 digits)', () => {
            expect(isValidPhone('1380013800')).toBe(false)
        })
        it('should return false for invalid phone numbers (not start with 1)', () => {
            expect(isValidPhone('23800138000')).toBe(false)
        })
    })

    describe('isNotEmpty', () => {
        it('should return false for empty strings', () => {
            expect(isNotEmpty('')).toBe(false)
        })
        it('should return false for strings with only spaces', () => {
            expect(isNotEmpty('   ')).toBe(false)
        })
        it('should return true for normal strings', () => {
            expect(isNotEmpty('张三')).toBe(true)
        })
        it('should return false for undefined or null', () => {
            expect(isNotEmpty(undefined)).toBe(false)
            expect(isNotEmpty(null)).toBe(false)
        })
    })

    describe('isValidLength', () => {
        it('should return true when length is within range', () => {
            expect(isValidLength('hello', 1, 10)).toBe(true)
        })
        it('should return false when length is out of range', () => {
            expect(isValidLength('hi', 5, 10)).toBe(false)
        })
        it('should return false for undefined or null', () => {
            expect(isValidLength(undefined, 1, 10)).toBe(false)
            expect(isValidLength(null, 1, 10)).toBe(false)
        })
    })

    describe('isValidEmail', () => {
        it('should return true for valid emails', () => {
            expect(isValidEmail('test@example.com')).toBe(true)
        })
        it('should return false for invalid emails', () => {
            expect(isValidEmail('invalid-email')).toBe(false)
            expect(isValidEmail('test@.com')).toBe(false)
        })
        it('should return false for undefined or null', () => {
            expect(isValidEmail(undefined)).toBe(false)
            expect(isValidEmail(null)).toBe(false)
        })
    })
})
