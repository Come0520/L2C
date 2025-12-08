#!/usr/bin/env node

/**
 * 性能测试脚本
 * 用于定期运行性能测试，支持通过环境变量配置测试参数
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 测试配置
const TEST_CONFIG = {
  urls: [
    'http://localhost:3000/login',
    // 基准页测试 URL
    'http://localhost:3000/dashboard',
    'http://localhost:3000/orders/status/all',
    'http://localhost:3000/leads/kanban',
    'http://localhost:3000/notifications',
    // 注意：需要登录的页面需要先处理认证
  ],
  outputDir: path.join(__dirname, '../lighthouse-results'),
  chromeFlags: '--no-sandbox --headless --disable-gpu',
  throttlingMethod: 'simulate',
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4,
  },
};

/**
 * 运行 Lighthouse 性能测试
 * @param {string} url 测试 URL
 * @param {string} outputPath 输出路径
 */
function runLighthouse(url, outputPath) {
  console.log(`🔍 Running Lighthouse test on ${url}...`);
  
  try {
    // 构建 Lighthouse 命令
    const command = `npx lighthouse ${url} ` +
      `--output html ` +
      `--output json ` +
      `--chrome-flags="${TEST_CONFIG.chromeFlags}" ` +
      `--throttling-method="${TEST_CONFIG.throttlingMethod}" ` +
      `--throttling.rttMs=${TEST_CONFIG.throttling.rttMs} ` +
      `--throttling.throughputKbps=${TEST_CONFIG.throttling.throughputKbps} ` +
      `--throttling.cpuSlowdownMultiplier=${TEST_CONFIG.throttling.cpuSlowdownMultiplier} ` +
      `--output-path="${outputPath}" ` +
      `--quiet`;
    
    // 执行命令
    execSync(command, { stdio: 'inherit', shell: true });
    console.log(`✅ Test completed: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Test failed for ${url}:`, error.message);
    return false;
  }
}

/**
 * 运行所有性能测试
 */
function runAllTests() {
  console.log('🚀 Starting performance tests...');
  
  // 创建输出目录
  if (!fs.existsSync(TEST_CONFIG.outputDir)) {
    fs.mkdirSync(TEST_CONFIG.outputDir, { recursive: true });
  }
  
  // 记录开始时间
  const startTime = new Date();
  const timestamp = startTime.toISOString().replace(/[:.]/g, '-');
  
  // 运行每个 URL 的测试
  const results = TEST_CONFIG.urls.map((url) => {
    const filename = url.replace(/[^a-zA-Z0-9]/g, '_');
    const outputPath = path.join(TEST_CONFIG.outputDir, `${filename}_${timestamp}`);
    return runLighthouse(url, outputPath);
  });
  
  // 记录完成时间
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;
  
  // 输出结果
  const successCount = results.filter(Boolean).length;
  const totalCount = results.length;
  
  console.log(`📊 Performance test summary:`);
  console.log(`   Total tests: ${totalCount}`);
  console.log(`   Passed: ${successCount}`);
  console.log(`   Failed: ${totalCount - successCount}`);
  console.log(`   Duration: ${duration.toFixed(2)}s`);
  console.log(`   Results saved to: ${TEST_CONFIG.outputDir}`);
  
  // 生成报告
  generateReport(startTime, endTime, successCount, totalCount);
  
  return successCount === totalCount;
}

/**
 * 生成测试报告
 */
function generateReport(startTime, endTime, successCount, totalCount) {
  const report = {
    timestamp: startTime.toISOString(),
    duration: (endTime - startTime) / 1000,
    successCount,
    totalCount,
    urls: TEST_CONFIG.urls,
    config: TEST_CONFIG,
  };
  
  const reportPath = path.join(TEST_CONFIG.outputDir, `report_${startTime.toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📋 Report generated: ${reportPath}`);
}

/**
 * 主函数
 */
function main() {
  try {
    const success = runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = { runAllTests, runLighthouse };
