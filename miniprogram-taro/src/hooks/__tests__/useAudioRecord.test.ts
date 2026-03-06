import { renderHook, act } from '@testing-library/react'
// 直接从 mock 文件引入 helper（避免 TS 类型冲突）
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __getMockRecorderManager } = require('../../__mocks__/@tarojs/taro')
import { useAudioRecord } from '../useAudioRecord'

let capturedOnStop: ((res: { tempFilePath: string; duration: number }) => void) | null = null

beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    capturedOnStop = null

    const manager = __getMockRecorderManager()
    // 捕获 onStop 回调，以便测试中手动触发
    manager.onStop.mockImplementation((cb: (res: { tempFilePath: string; duration: number }) => void) => {
        capturedOnStop = cb
    })
})

afterEach(() => {
    jest.useRealTimers()
})

describe('useAudioRecord - 录音 Hook', () => {
    // T6: start/stop 正确调用 RecorderManager API
    it('T6: start() 调用 manager.start，stop() 调用 manager.stop，onStop 后更新 audioPath', () => {
        const manager = __getMockRecorderManager()
        const { result } = renderHook(() => useAudioRecord())

        expect(result.current.isRecording).toBe(false)

        act(() => { result.current.start() })
        expect(manager.start).toHaveBeenCalledTimes(1)
        expect(result.current.isRecording).toBe(true)

        act(() => { result.current.stop() })
        expect(manager.stop).toHaveBeenCalledTimes(1)

        // 模拟 onStop 回调
        act(() => {
            capturedOnStop?.({ tempFilePath: 'mock_audio.mp3', duration: 10 })
        })

        expect(result.current.isRecording).toBe(false)
        expect(result.current.audioPath).toBe('mock_audio.mp3')
        expect(result.current.duration).toBe(10)
    })

    // T7: 超过 180 秒自动 stop
    it('T7: 录制超过 180 秒时自动调用 manager.stop', () => {
        const manager = __getMockRecorderManager()
        const { result } = renderHook(() => useAudioRecord())

        act(() => { result.current.start() })
        expect(result.current.isRecording).toBe(true)

        act(() => {
            jest.advanceTimersByTime(180 * 1000)
        })

        expect(manager.stop).toHaveBeenCalledTimes(1)
    })
})
