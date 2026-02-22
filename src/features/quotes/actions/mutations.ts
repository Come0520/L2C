'use server';

/**
 * 报价单 Actions 桶文件 (Barrel File)
 * 将所有 Action 模块统一重新导出，保持现有导入路径兼容
 *
 * 拆分模块一览：
 * - shared-helpers.ts     ← 计算辅助函数
 * - quote-crud.ts         ← 报价单 CRUD
 * - quote-room-crud.ts    ← 房间 CRUD
 * - quote-item-crud.ts    ← 行项目 CRUD
 * - quote-lifecycle-actions.ts ← 生命周期操作
 * - quick-quote-action.ts ← 快速报价
 */

// ── 报价单 CRUD ──────────────────────────────────
export {
  createQuote,
  createQuoteBundleActionInternal,
  updateQuote,
  copyQuote,
} from './quote-crud';

// ── 房间 CRUD ────────────────────────────────────
export { createRoom, createRoomActionInternal, updateRoom, deleteRoom } from './quote-room-crud';

// ── 行项目 CRUD ──────────────────────────────────
export {
  createQuoteItem,
  updateQuoteItem,
  deleteQuoteItem,
  reorderQuoteItems,
} from './quote-item-crud';

// ── 生命周期操作 ─────────────────────────────────
export {
  submitQuote,
  rejectQuote,
  lockQuote,
  unlockQuote,
  approveQuote,
  rejectQuoteDiscount,
  convertQuoteToOrder,
  createNextVersion,
} from './quote-lifecycle-actions';

// ── 快速报价 ─────────────────────────────────────
export { createQuickQuote } from './quick-quote-action';
