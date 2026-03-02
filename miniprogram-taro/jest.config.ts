/**
 * Jest 配置
 *
 * @description Taro + React 小程序测试环境配置。
 */
import type { Config } from 'jest'

const config: Config = {
    testEnvironment: 'jsdom',

    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
            jsx: 'react-jsx',
            diagnostics: {
                ignoreDiagnostics: [6133, 6196],
            },
        }],
    },

    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}',
        '<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
    ],

    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(scss|css|less)$': 'identity-obj-proxy',
        '\\.(png|jpg|jpeg|gif|svg|webp)$': '<rootDir>/src/__mocks__/fileMock.ts',
        '@tarojs/components': '<rootDir>/src/__mocks__/@tarojs/components.tsx',
        '@tarojs/taro': '<rootDir>/src/__mocks__/@tarojs/taro.ts',
    },

    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

    transformIgnorePatterns: [
        'node_modules/(?!(@tarojs)/)',
    ],

    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.config.{ts,tsx}',
        '!src/**/__mocks__/**',
        '!src/**/__tests__/**',
        '!src/app.ts',
    ],
}

export default config
