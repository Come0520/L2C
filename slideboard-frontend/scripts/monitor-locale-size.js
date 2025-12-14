#!/usr/bin/env node

/**
 * 监控国际化文件大小脚本
 * 当zh-CN.json文件大小超过100KB时发出警告
 */

const fs = require('fs');
const path = require('path');

const MAX_FILE_SIZE = 100 * 1024; // 100KB
const LOCALE_FILE_PATH = path.join(__dirname, '../src/locales/zh-CN.json');

function monitorLocaleFileSize() {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(LOCALE_FILE_PATH)) {
      console.log('ℹ️  zh-CN.json 文件不存在，跳过大小检查');
      return;
    }
    
    // 获取文件信息
    const stats = fs.statSync(LOCALE_FILE_PATH);
    const fileSizeInBytes = stats.size;
    const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
    
    console.log(`📦 zh-CN.json 文件大小: ${fileSizeInKB} KB`);
    
    // 检查文件大小是否超过阈值
    if (fileSizeInBytes > MAX_FILE_SIZE) {
      console.warn('⚠️  警告: zh-CN.json 文件大小超过 100KB，建议考虑分割命名空间或使用服务端翻译，以避免增加 HTML 水合负载');
      console.warn(`   当前大小: ${fileSizeInKB} KB，阈值: 100 KB`);
      console.warn('   建议: 考虑将翻译按页面或功能模块分割成多个文件');
      
      // 非CI环境下，可以选择退出进程
      if (!process.env.CI) {
        // 不退出进程，只发出警告
        process.exitCode = 0;
      }
    } else {
      console.log('✅ zh-CN.json 文件大小在合理范围内');
    }
  } catch (error) {
    console.error('❌ 监控国际化文件大小失败:', error.message);
    process.exitCode = 1;
  }
}

// 执行监控
monitorLocaleFileSize();
