/**
 * 生产环境构建配置
 */
import type { UserConfigExport } from '@tarojs/cli'

export default {
    mini: {},
    h5: {
        /**
         * 根据 webpack5 官方文档建议，生产环境使用 deterministic
         * @see https://webpack.js.org/configuration/optimization/#optimizationmoduleids
         */
        optimizeMainPackage: {
            enable: true,
        },
    },
} satisfies UserConfigExport<'webpack5'>
