/**
 * Miniprogram API 全面冒烟测试脚本 (Sprint 1 验收)
 *由于我们重构了所有 Miniprogram API 的认证中间件，此脚本用于验证关键 API 的连通性。
 * 执行：npx tsx scripts/smoke-test-miniprogram-v2.ts
 */

const API_BASE = 'http://localhost:3000';

// 测试用户凭证 (假设环境中有此用户)
const TEST_CREDENTIALS = {
    account: '15601911921', // 这是一个假设的测试账号，如果失败请更换
    password: 'I@l2c2026',
};

interface ApiResponse {
    success: boolean;
    data?: any;
    error?: string;
}

// 辅助函数：带 Token 的 Fetch
async function fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    return fetch(`${API_BASE}${url}`, { ...options, headers });
}

// 1. 登录
async function stepLogin(): Promise<string | null> {
    console.log('🔐 [1/6] 测试登录 (Auth)...');
    try {
        const response = await fetch(`${API_BASE}/api/miniprogram/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_CREDENTIALS),
        });
        const result: ApiResponse = await response.json();

        if (result.success && result.data?.token) {
            console.log(`   ✅ 登录成功! Tenant: ${result.data.user.tenantName} (${result.data.user.tenantId})\n`);
            return result.data.token;
        } else {
            console.error(`   ❌ 登录失败: ${result.error}\n`);
            return null;
        }
    } catch (error) {
        console.error(`   ❌ 请求异常: ${error}\n`);
        return null;
    }
}

// 2. Tasks 模块
async function stepTasks(token: string) {
    console.log('📋 [2/6] 测试任务模块 (Tasks)...');
    try {
        const res = await fetchWithAuth('/api/miniprogram/tasks?type=all', token);
        const result: ApiResponse = await res.json();
        if (result.success) {
            const mCount = result.data?.measureTasks?.length || 0;
            const iCount = result.data?.installTasks?.length || 0;
            console.log(`   ✅ 列表获取成功: 测量任务=${mCount}, 安装任务=${iCount}`);

            // 如果有任务，测试详情
            if (mCount > 0) {
                const taskId = result.data.measureTasks[0].id;
                console.log(`   🔎 测试任务详情 ID: ${taskId}...`);
                const resDetail = await fetchWithAuth(`/api/miniprogram/tasks/${taskId}`, token);
                const detailResult = await resDetail.json();
                if (detailResult.success) {
                    console.log(`   ✅ 任务详情获取成功: No=${detailResult.data.measureNo}`);
                } else {
                    console.error(`   ❌ 任务详情获取失败: ${detailResult.error}`);
                }
            } else {
                console.log('   ⚠️ 无测量任务，跳过详情测试');
            }
        } else {
            console.error(`   ❌ 列表获取失败: ${result.error}`);
        }
        console.log('');
    } catch (e) { console.error(e); }
}

// 3. Products 模块
async function stepProducts(token: string) {
    console.log('🛍️ [3/6] 测试商品模块 (Products)...');
    try {
        const res = await fetchWithAuth('/api/miniprogram/products?keyword=', token);
        const result: ApiResponse = await res.json();
        if (result.success) {
            console.log(`   ✅ 商品列表获取成功: 数量=${result.data?.length}`);
            if (result.data?.length > 0) {
                console.log(`   - 示例商品: ${result.data[0].name} (${result.data[0].unitPrice}元)`);
            }
        } else {
            console.error(`   ❌ 商品列表获取失败: ${result.error}`);
        }
        console.log('');
    } catch (e) { console.error(e); }
}

// 4. Quotes 模块
async function stepQuotes(token: string) {
    console.log('📜 [4/6] 测试报价模块 (Quotes)...');
    try {
        const res = await fetchWithAuth('/api/miniprogram/quotes?status=all', token);
        const result: ApiResponse = await res.json();
        if (result.success) {
            console.log(`   ✅ 报价列表获取成功: 数量=${result.data?.length}`);
        } else {
            console.error(`   ❌ 报价列表获取失败: ${result.error}`);
        }
        console.log('');
    } catch (e) { console.error(e); }
}

// 5. Earnings 模块
async function stepEarnings(token: string) {
    console.log('💰 [5/6] 测试收入模块 (Earnings)...');
    try {
        const res = await fetchWithAuth('/api/miniprogram/engineer/earnings', token);
        const result: ApiResponse = await res.json();
        if (result.success) {
            console.log(`   ✅ 收入信息获取成功: 已结算=${result.data.totalEarned}, 待结算=${result.data.pendingAmount}`);
        } else {
            console.error(`   ❌ 收入信息获取失败: ${result.error}`);
        }
        console.log('');
    } catch (e) { console.error(e); }
}

// 6. CRM 模块 (Customers)
async function stepCRM(token: string) {
    console.log('👥 [6/6] 测试 CRM 模块 (Customers)...');
    try {
        const res = await fetchWithAuth('/api/miniprogram/customers', token);
        const result: ApiResponse = await res.json();
        if (result.success) {
            console.log(`   ✅ 客户列表获取成功: 数量=${result.data?.length}`);
        } else {
            console.error(`   ❌ 客户列表获取失败: ${result.error}`);
        }
        console.log('');
    } catch (e) { console.error(e); }
}

async function main() {
    console.log('🚀 开始 Miniprogram API 冒烟测试\n');
    const token = await stepLogin();
    if (!token) {
        console.log('⚠️ 请检查本地服务是否启动 (http://localhost:3000) 以及测试账号是否正确');
        return;
    }

    await stepTasks(token);
    await stepProducts(token);
    await stepQuotes(token);
    await stepEarnings(token);
    await stepCRM(token);

    console.log('✨ 测试结束');
}

main();
