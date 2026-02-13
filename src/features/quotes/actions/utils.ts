'use server';

// 报价模块工具函数
export async function formatQuoteNo(type: string, date: Date) {
    return `${type}-${date.getTime()}`;
}

export async function validateQuoteData(_data: unknown) {
    return true;
}
