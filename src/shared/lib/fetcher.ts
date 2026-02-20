/**
 * 通用 Fetcher，用于 SWR 请求
 * 处理 HTTP 错误并返回 JSON 数据
 */
export const fetcher = async (url: string) => {
    const res = await fetch(url);

    // 如果接口返回 4xx 或 5xx，抛出错误
    if (!res.ok) {
        const error = new Error("请求失败");
        // 将额外的信息附加到错误对象上
        const info = await res.json().catch(() => ({}));
        (error as any).info = info;
        (error as any).status = res.status;
        throw error;
    }

    return res.json();
};
