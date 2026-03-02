/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testMatch: ['**/__tests__/**/*.test.ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            isolatedModules: true,
        }],
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
};
