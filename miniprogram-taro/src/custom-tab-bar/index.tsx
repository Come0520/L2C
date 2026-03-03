import { View } from '@tarojs/components'
import './index.scss'

/**
 * 微信原生自定义 TabBar 的占位组件
 *
 * @description 因为 app.config.ts 开启了 `custom: true`，微信强制要求必须有此目录。
 * 本项目中，真实的 TabBar 已在各个页面级组件（如 pages/workbench/index）的底部手动引入，
 * 为了避免双重渲染和体验隔离问题，原生的 custom-tab-bar 这里直接渲染为空视图（占位），
 * 依靠页面的 <TabBar /> 提供真实的 UI。
 */
export default function CustomTabBar() {
    return <View className="custom-tab-bar-placeholder" />
}
