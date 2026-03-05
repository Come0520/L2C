/**
 * @tarojs/taro Mock
 *
 * @description 模拟 Taro API，使测试可以在 Node.js 环境中运行。
 * 所有方法默认为 jest.fn()，测试中可通过 mockReturnValue / mockImplementation 自定义行为。
 */

// ---------- Storage API ----------
const storage: Record<string, any> = {}

const getStorageSync = jest.fn((key: string) => storage[key] ?? '')
const setStorageSync = jest.fn((key: string, data: any) => { storage[key] = data })
const removeStorageSync = jest.fn((key: string) => { delete storage[key] })
const getStorage = jest.fn(({ key }: { key: string }) => Promise.resolve({ data: storage[key] ?? '' }))

/** 清理模拟 Storage（在 beforeEach 中调用） */
export function __clearMockStorage() {
    Object.keys(storage).forEach(key => delete storage[key])
}

// ---------- 导航 API ----------
const navigateTo = jest.fn(() => Promise.resolve())
const switchTab = jest.fn(() => Promise.resolve())
const redirectTo = jest.fn(() => Promise.resolve())
const navigateBack = jest.fn(() => Promise.resolve())
const reLaunch = jest.fn(() => Promise.resolve())

// ---------- UI 反馈 API ----------
const showToast = jest.fn(() => Promise.resolve())
const hideToast = jest.fn(() => Promise.resolve())
const showLoading = jest.fn(() => Promise.resolve())
const hideLoading = jest.fn(() => Promise.resolve())
const showModal = jest.fn(() => Promise.resolve({ confirm: true, cancel: false }))

// ---------- 媒体 API ----------
const chooseMedia = jest.fn(() => Promise.resolve({ tempFiles: [] }))
const uploadFile = jest.fn(() => Promise.resolve({ statusCode: 200, data: '{}' }))

// ---------- 分享 API ----------
const shareAppMessage = jest.fn(() => Promise.resolve())
const showActionSheet = jest.fn(() => Promise.resolve({ tapIndex: 0 }))

// ---------- 网络请求 API ----------
const request = jest.fn(() => Promise.resolve({ statusCode: 200, data: {} }))

// ---------- 微信登录 API ----------
const login = jest.fn(() => Promise.resolve({ code: 'mock_wx_code' }))

// ---------- 页面信息 API ----------
const getCurrentPages = jest.fn(() => [{ route: 'pages/workbench/index' }])

// ---------- 系统信息 API ----------
const getSystemInfoSync = jest.fn(() => ({
    platform: 'devtools',
    windowWidth: 375,
    windowHeight: 667,
    statusBarHeight: 20,
    safeArea: { bottom: 667, top: 20, left: 0, right: 375, width: 375, height: 647 },
}))

// ---------- Taro Hooks（测试中不自动触发回调，避免 setState 造成无限 re-render） ----------
const useDidShow = jest.fn()
const useDidHide = jest.fn()
const useLoad = jest.fn()
const usePullDownRefresh = jest.fn()
const useReachBottom = jest.fn()
const useRouter = jest.fn(() => ({ params: {} }))

// ---------- 默认导出 ----------
const Taro = {
    getStorageSync,
    setStorageSync,
    removeStorageSync,
    getStorage,
    navigateTo,
    switchTab,
    redirectTo,
    navigateBack,
    reLaunch,
    showToast,
    hideToast,
    showLoading,
    hideLoading,
    showModal,
    request,
    login,
    getCurrentPages,
    getSystemInfoSync,
    useDidShow,
    useDidHide,
    useLoad,
    usePullDownRefresh,
    useReachBottom,
    useRouter,
    chooseMedia,
    uploadFile,
    shareAppMessage,
    showActionSheet,
}

export {
    getStorageSync,
    setStorageSync,
    removeStorageSync,
    getStorage,
    navigateTo,
    switchTab,
    redirectTo,
    navigateBack,
    reLaunch,
    showToast,
    hideToast,
    showLoading,
    hideLoading,
    showModal,
    request,
    login,
    getCurrentPages,
    getSystemInfoSync,
    useDidShow,
    useDidHide,
    useLoad,
    usePullDownRefresh,
    useReachBottom,
    useRouter,
    chooseMedia,
    uploadFile,
    shareAppMessage,
    showActionSheet,
}

export default Taro
