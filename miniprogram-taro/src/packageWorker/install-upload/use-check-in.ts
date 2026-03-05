import Taro from '@tarojs/taro'
import { useState } from 'react'
import { taskService } from '@/services/task-service'

export function useCheckIn(taskId: string) {
    const [isCheckedIn, setIsCheckedIn] = useState(false)

    const handleCheckIn = async () => {
        if (!taskId) return

        Taro.showLoading({ title: '定位中...' })
        try {
            const loc = await Taro.getLocation({ type: 'gcj02' })
            await taskService.checkIn(taskId, {
                latitude: loc.latitude,
                longitude: loc.longitude,
                address: '自动定位地址'
            })
            Taro.hideLoading()
            Taro.showToast({ title: '已到达现场', icon: 'success' })
            setIsCheckedIn(true)
        } catch (err: any) {
            Taro.hideLoading()
            Taro.showToast({ title: err.message || '打卡失败', icon: 'none' })
        }
    }

    return {
        isCheckedIn,
        setIsCheckedIn, // 暴露 setter 以便初始化或重置
        handleCheckIn
    }
}
