let cachedEnv = null;
/**
 * 判断当前运行环境
 * 多端应用（App）模式下脱离了微信原生客户端环境，部分原生 API 需要做条件处理。
 */
export function getEnvInfo() {
    if (cachedEnv) {
        return cachedEnv;
    }
    try {
        const sys = wx.getSystemInfoSync();
        // 如果平台包含 android/ios 或 environment 被指定为 miniapp，大多为多端框架
        const isApp = sys.environment === 'miniapp' || sys.platform === 'android' || sys.platform === 'ios';
        cachedEnv = {
            isApp: !!isApp,
            platform: sys.platform || 'unknown',
            environment: sys.environment || 'wx',
            system: sys.system || 'unknown'
        };
        console.log('[Env] Init:', cachedEnv);
        return cachedEnv;
    }
    catch (e) {
        console.error('[Env] failed to get system info:', e);
        return {
            isApp: false, // 降级为默认微信环境
            platform: 'unknown',
            environment: 'unknown',
            system: 'unknown'
        };
    }
}
/**
 * 是否是多端应用 (App) 环境
 */
export function isAppEnv() {
    return getEnvInfo().isApp;
}
