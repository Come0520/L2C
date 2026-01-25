/**
 * Database Connection Configuration
 * Uses Drizzle ORM with Postgres.js
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '@/shared/config/env';

console.log('[DEBUG] INITIALIZING DB', env.DATABASE_URL ? 'URL Present' : 'URL Missing');

const connectionString = env.DATABASE_URL;

if (!connectionString) {
  throw new Error(' DATABASE_URL is not defined');
}

const client = postgres(connectionString, {
  max: env.DB_MAX_CONNECTIONS,
  idle_timeout: 30, // 空闲超时 30s
  connect_timeout: 10,
  prepare: true,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
export type Transaction = Parameters<Parameters<DB['transaction']>[0]>[0];
