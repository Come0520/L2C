/**
 * 数据库连接配置
 * 使用 Drizzle ORM + Postgres.js
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '../config/env';

const connectionString = env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const isProd = process.env.NODE_ENV === 'production';

const client = postgres(connectionString, {
  max: env.DB_MAX_CONNECTIONS,
  idle_timeout: 30, // 空闲超时 30s
  connect_timeout: 10, // 连接超时 10s
  /**
   * [数据库 SSL 配置]
   * 阿里云 RDS 默认未启用 SSL 监听，强制 TLS 握手会导致 ECONNRESET。
   * VPC 内网连接本身由网络隔离保障安全，无需 TLS 加密。
   * 通过环境变量 DB_SSL=true 可在需要时启用 SSL（如跨公网连接场景）。
   */
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  /**
   * [H6 修复] 生产环境启用预编译语句，提升重复查询性能
   * Serverless 环境（Vercel Edge / Lambda）需关闭（连接不保留 state）
   */
  prepare: isProd,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
export type DbTransaction = Parameters<Parameters<DB['transaction']>[0]>[0];
