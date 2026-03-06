import Taro from '@tarojs/taro'
import { useState, useRef } from 'react'

// 最大录音时长（秒）
const MAX_DURATION_SECONDS = 180

interface AudioRecordState {
    isRecording: boolean
    audioPath: string
    duration: number
    start: () => void
    stop: () => void
}

/**
 * useAudioRecord — 录音管理 Hook
 * 使用 Taro.getRecorderManager()，超过 MAX_DURATION_SECONDS 自动停止
 */
export function useAudioRecord(): AudioRecordState {
    const [isRecording, setIsRecording] = useState(false)
    const [audioPath, setAudioPath] = useState('')
    const [duration, setDuration] = useState(0)
    // 自动停止的定时器引用
    const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    // 复用同一个 RecorderManager 实例
    const managerRef = useRef<Taro.RecorderManager | null>(null)

    const getManager = () => {
        if (!managerRef.current) {
            managerRef.current = Taro.getRecorderManager()
            managerRef.current.onStop((res) => {
                setAudioPath(res.tempFilePath)
                setDuration(res.duration)
                setIsRecording(false)
            })
        }
        return managerRef.current
    }

    const stop = () => {
        if (autoStopTimer.current) {
            clearTimeout(autoStopTimer.current)
            autoStopTimer.current = null
        }
        getManager().stop()
    }

    const start = () => {
        const manager = getManager()
        manager.start({ duration: MAX_DURATION_SECONDS * 1000 })
        setIsRecording(true)
        // 超过最大时长自动停止
        autoStopTimer.current = setTimeout(() => {
            stop()
        }, MAX_DURATION_SECONDS * 1000)
    }

    return { isRecording, audioPath, duration, start, stop }
}
