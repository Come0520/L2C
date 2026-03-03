/**
 * 网络状态检测工具
 */
import Taro from '@tarojs/taro'

/** 检查网络是否可用 */
export async function checkNetwork(): Promise<boolean> {
    try {
        const res = await Taro.getNetworkType()
        return res.networkType !== 'none'
    } catch {
        return false
    }
}

/** 显示断网提示 */
export function showOfflineToast() {
    Taro.showToast({
        title: '网络连接不可用，请检查网络设置',
        icon: 'none',
        duration: 3000,
    })
}
