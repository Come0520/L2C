 
import { execSync } from 'child_process';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function verifyDeployment() {
    console.log('🔍 Starting Deployment Verification...');
    console.log(`Target Server: ${BASE_URL}`);

    try {
        // 1. Get Local Commit SHA
        const localSha = execSync('git rev-parse --short HEAD').toString().trim();
        console.log(`📌 Local Commit SHA: ${localSha}`);

        // 2. Check Health Endpoint
        console.log('Checking /api/health...');
        try {
            const healthRes = await fetch(`${BASE_URL}/api/health`);

            if (healthRes.ok) {
                const healthData = await healthRes.json();
                console.log('✅ Health Check Passed:', healthData);

                if (healthData.dbStatus !== 'connected') {
                    console.error('❌ Database is NOT connected:', healthData.dbStatus);
                    process.exit(1);
                }
            } else {
                console.error(`❌ 健康检查失败 - 状态码: ${healthRes.status}`);
                const text = await healthRes.text();
                console.log('   以及响应:', text);
            }
        } catch (e) {
            console.error('❌ 无法连接到服务器 (可能服务未启动或防火墙拦截)', e);
        }

        // 3. 检查版本信息
        console.log('biu~ 获取部署版本信息...');
        try {
            const versionRes = await fetch(`${BASE_URL}/version.json`);

            if (versionRes.ok) {
                const versionData = await versionRes.json() as any;
                console.log('📄 远程版本信息:', versionData);

                if (versionData.sha === localSha) {
                    console.log('✅ 版本一致: 部署已是最新代码');
                } else {
                    console.warn(`⚠️ 版本不一致: 远程(${versionData.sha}) vs 本地(${localSha})`);
                    console.warn('   可能是流水线尚未完成部署，或部署失败。');
                }
            } else {
                console.warn(`⚠️ 无法获取版本信息 (Status: ${versionRes.status}) - 可能是旧版本未生成 version.json`);
            }
        } catch (e) {
            console.error('❌ 获取版本信息失败', e);
        }

    } catch (error) {
        console.error('❌ 验证过程中发生错误:', error);
    }
}

verifyDeployment();

// Run with: npx tsx scripts/verify-deployment.ts
