/**
 * Auth 模块共享常量
 *
 * 统一管理所有密码哈希相关的常量，避免各模块独立定义导致不一致。
 */

/**
 * Bcrypt 密码哈希盐值迭代轮数 (Salt Rounds)
 *
 * @description
 * - 采用 10 轮迭代，是安全性与计算性能的标准折衷点。
 * - 所有需要散列密码的地方（注册、重置）均引用此常量，保证一致性。
 *
 * @constant {number}
 */
export const BCRYPT_ROUNDS = 10;
