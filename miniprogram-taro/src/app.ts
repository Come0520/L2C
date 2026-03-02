/**
 * L2C 小程序入口文件
 *
 * @description Taro 应用根组件，用于包裹全局 Provider 和初始化逻辑。
 */
import { PropsWithChildren } from 'react'
import './app.scss'

/**
 * 应用根组件
 * 在此处可添加全局 Provider（如 Zustand、主题等）
 */
function App({ children }: PropsWithChildren) {
    return children
}

export default App
