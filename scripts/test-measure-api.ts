/**
 * 测量模块 API 测试脚本
 * 执行：npx tsx scripts/test-measure-api.ts
 */

const API_BASE = 'http://localhost:3000';

// 测试用户凭证
const TEST_CREDENTIALS = {
    account: '15601911921',
    password: 'I@l2c2026',
};

interface ApiResponse {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * 登录获取 Token
 */
async function login(): Promise<string | null> {
    try {
        console.log('🔐 正在登录...');
        const response = await fetch(`${API_BASE}/api/miniprogram/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_CREDENTIALS),
        });

        const result: ApiResponse = await response.json();

        if (result.success && result.data?.token) {
            console.log('✅ 登录成功\n');
            return result.data.token;
        } else {
            console.error('❌ 登录失败:', result.error);
            return null;
        }
    } catch (error) {
        console.error('❌ 登录请求失败:', error);
        return null;
    }
}

/**
 * 测试任务列表 API
 */
async function testTaskList(token: string) {
    console.log('📋 测试任务列表 API');
    console.log('GET /api/miniprogram/tasks?type=measure\n');

    try {
        const response = await fetch(`${API_BASE}/api/miniprogram/tasks?type=measure`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        const result: ApiResponse = await response.json();

        if (result.success) {
            console.log('✅ 任务列表获取成功');
            console.log(`   - 测量任务数量: ${result.data?.measureTasks?.length || 0}`);

            if (result.data?.measureTasks?.length > 0) {
                const task = result.data.measureTasks[0];
                console.log(`   - 示例任务: ${task.measureNo}`);
                console.log(`   - 工费字段: ${task.laborFee ? '✓ 存在' : '✗ 缺失'}`);
                console.log(`   - 类型字段: ${task.type ? '✓ 存在' : '✗ 缺失'}`);
                return task.id; // 返回第一个任务 ID 用于后续测试
            }
        } else {
            console.error('❌ 任务列表获取失败:', result.error);
        }
    } catch (error) {
        console.error('❌ 请求失败:', error);
    }

    console.log('');
    return null;
}

/**
 * 测试任务详情 API
 */
async function testTaskDetail(token: string, taskId: string) {
    console.log('📄 测试任务详情 API');
    console.log(`GET /api/miniprogram/tasks/${taskId}\n`);

    try {
        const response = await fetch(`${API_BASE}/api/miniprogram/tasks/${taskId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        const result: ApiResponse = await response.json();

        if (result.success) {
            console.log('✅ 任务详情获取成功');
            console.log(`   - 任务编号: ${result.data?.measureNo}`);
            console.log(`   - 客户信息: ${result.data?.customer ? '✓ 存在' : '✗ 缺失'}`);
            console.log(`   - 工费定价: ${result.data?.laborRateInfo ? '✓ 存在' : '✗ 缺失'}`);
            console.log(`   - 报价预览: ${result.data?.quoteSummary ? '✓ 存在' : '✗ 缺失'}`);
        } else {
            console.error('❌ 任务详情获取失败:', result.error);
        }
    } catch (error) {
        console.error('❌ 请求失败:', error);
    }

    console.log('');
}

/**
 * 测试工费汇总 API
 */
async function testEarnings(token: string) {
    console.log('💰 测试工费汇总 API');
    console.log('GET /api/miniprogram/engineer/earnings\n');

    try {
        const response = await fetch(`${API_BASE}/api/miniprogram/engineer/earnings`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        const result: ApiResponse = await response.json();

        if (result.success) {
            console.log('✅ 工费汇总获取成功');
            console.log(`   - 累计已结算: ¥${result.data?.totalEarned || 0}`);
            console.log(`   - 待结算金额: ¥${result.data?.pendingAmount || 0}`);
            console.log(`   - 最近明细数: ${result.data?.recentDetails?.length || 0}`);
        } else {
            console.error('❌ 工费汇总获取失败:', result.error);
        }
    } catch (error) {
        console.error('❌ 请求失败:', error);
    }

    console.log('');
}

/**
 * 主测试流程
 */
async function main() {
    console.log('🚀 开始测试测量模块 API\n');
    console.log('='.repeat(60));
    console.log('');

    // 1. 登录
    const token = await login();
    if (!token) {
        console.error('❌ 无法获取 Token，测试终止');
        process.exit(1);
    }

    // 2. 测试任务列表
    const taskId = await testTaskList(token);

    // 3. 测试任务详情（如果有任务）
    if (taskId) {
        await testTaskDetail(token, taskId);
    } else {
        console.log('⚠️  没有测量任务，跳过任务详情测试\n');
    }

    // 4. 测试工费汇总
    await testEarnings(token);

    console.log('='.repeat(60));
    console.log('✅ 测试完成！\n');

    console.log('📝 注意事项：');
    console.log('   - GPS 签到和测量数据提交 API 需要有效的任务 ID 和数据');
    console.log('   - 建议在微信开发者工具中进行完整的端到端测试');
}

main();
