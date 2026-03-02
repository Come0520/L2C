/**
 * L2C 小程序入口文件
 *
 * @description Taro 应用根组件，用于包裹全局 Provider 和初始化逻辑。
 */
import { PropsWithChildren, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import './app.scss'

/**
 * 应用根组件
 * 在此处可添加全局 Provider（如 Zustand、主题等）
 */
function App({ children }: PropsWithChildren) {
    // 冷启动时恢复登录态：从 Storage 中读取 Token 和用户信息写入内存
    useEffect(() => {
        useAuthStore.getState().restore()
    }, [])

    return children
}

export default App
