export interface EnvInfo {
    isApp: boolean;
    platform: string;
    environment: string;
    system: string;
}
/**
 * 判断当前运行环境
 * 多端应用（App）模式下脱离了微信原生客户端环境，部分原生 API 需要做条件处理。
 */
export declare function getEnvInfo(): EnvInfo;
/**
 * 是否是多端应用 (App) 环境
 */
export declare function isAppEnv(): boolean;
