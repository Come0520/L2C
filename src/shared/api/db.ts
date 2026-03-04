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
   * [H6 修复] 生产环境启用 SSL（对接 RDS/云数据库）
   * 本地开发跳过 SSL，避免自签名证书问题
   */
  ssl: isProd ? { rejectUnauthorized: true } : false,
  /**
   * [H6 修复] 生产环境启用预编译语句，提升重复查询性能
   * Serverless 环境（Vercel Edge / Lambda）需关闭（连接不保留 state）
   */
  prepare: isProd,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
export type DbTransaction = Parameters<Parameters<DB['transaction']>[0]>[0];
