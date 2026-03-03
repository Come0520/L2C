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
    // 冷启动时异步恢复并校验登录态：
    // 1. 读取 Storage 中的 Token
    // 2. 调用 /auth/me 验证有效性
    // 3. 有效则恢复登录态，无效则清除（用户将在落地页看到未登录状态）
    useEffect(() => {
        useAuthStore.getState().restoreAndVerify()
    }, [])

    return children
}

export default App
