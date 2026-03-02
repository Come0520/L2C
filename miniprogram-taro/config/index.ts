/**
 * Taro Webpack5 构建通用配置
 *
 * @description 定义项目路径、别名、设计稿尺寸等核心构建参数
 */
import { defineConfig } from '@tarojs/cli'
import type { UserConfigExport } from '@tarojs/cli'
import path from 'path'

import devConfig from './dev'
import prodConfig from './prod'

// https://taro-docs.jd.com/docs/next/config
export default defineConfig<'webpack5'>(async (merge) => {
    const baseConfig: UserConfigExport<'webpack5'> = {
        projectName: 'l2c-miniprogram-taro',
        date: '2026-3-2',
        designWidth: 750,
        deviceRatio: {
            640: 2.34 / 2,
            750: 1,
            375: 2,
            828: 1.81 / 2,
        },
        sourceRoot: 'src',
        outputRoot: 'dist',
        plugins: [],
        defineConstants: {},
        copy: {
            patterns: [],
            options: {},
        },
        framework: 'react',
        compiler: 'webpack5',
        cache: {
            enable: false,
        },
        alias: {
            '@': path.resolve(__dirname, '..', 'src'),
        },
        mini: {
            postcss: {
                pxtransform: {
                    enable: true,
                    config: {},
                },
                cssModules: {
                    enable: true,
                    config: {
                        namingPattern: 'module',
                        generateScopedName: '[name]__[local]___[hash:base64:5]',
                    },
                },
            },
        },
        h5: {
            publicPath: '/',
            staticDirectory: 'static',
            postcss: {
                autoprefixer: {
                    enable: true,
                    config: {},
                },
                cssModules: {
                    enable: true,
                    config: {
                        namingPattern: 'module',
                        generateScopedName: '[name]__[local]___[hash:base64:5]',
                    },
                },
            },
        },
    }

    if (process.env.NODE_ENV === 'development') {
        return merge({}, baseConfig, devConfig)
    }
    return merge({}, baseConfig, prodConfig)
})
