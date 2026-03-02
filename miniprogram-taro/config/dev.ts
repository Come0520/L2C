/**
 * 开发环境构建配置
 */
import type { UserConfigExport } from '@tarojs/cli'

export default {
    logger: {
        quiet: false,
        stats: true,
    },
    mini: {},
    h5: {},
} satisfies UserConfigExport<'webpack5'>
