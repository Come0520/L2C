# Edge Function订单导出功能测试计划

## 1. 测试计划标识符
- **文档版本**: v1.0
- **制定日期**: 2025-12-13
- **测试对象**: Supabase Edge Function - export-orders
- **测试类型**: 功能测试

## 2. 测试目标
- 验证Edge Function能够正确导出指定订单数据
- 验证导出文件格式（CSV）符合要求
- 验证导出文件包含正确的中文表头和数据
- 验证导出文件可以成功下载
- 验证系统在各种测试场景下的稳定性和可靠性

## 3. 测试环境
- **Supabase项目**: rdpiajialjnmngnaokix
- **Edge Function URL**: https://rdpiajialjnmngnaokix.supabase.co/functions/v1/export-orders
- **Authorization Token**: sb_secret_5k6RlR3PqftG29R-yakSGg_z1w-JGHs
- **测试工具**: 
  - curl命令行工具
  - 现代浏览器（Chrome/Firefox/Safari）
  - Excel或类似表格软件
  - VSCode（用于验证文件编码）

## 4. 测试范围
### 4.1 功能范围
- 导出单个订单数据
- 支持CSV格式导出
- 自定义文件名
- 导出文件包含中文表头
- 导出文件数据完整性

### 4.2 非功能范围
- 性能测试（大量订单导出）
- 安全性测试
- 并发测试

## 5. 测试策略
### 5.1 测试方法
- **黑盒测试**: 基于API接口进行功能验证
- **手动测试**: 使用curl和浏览器Console执行测试
- **文件验证**: 下载并检查导出文件的内容和格式

### 5.2 测试数据准备
- 从Supabase数据库获取5个有效订单ID（使用文档中的SQL查询）
- 确保订单数据包含中文内容（客户名称、商品名称等）

## 6. 测试用例

### 测试用例1: 使用curl导出单个订单（CSV格式）
| 测试项 | 描述 |
|-------|------|
| 测试ID | TC-001 |
| 测试目标 | 验证使用curl工具调用Edge Function导出单个订单的功能 |
| 前置条件 | 已获取有效订单ID |
| 测试步骤 | 1. 替换curl命令中的<order-id>为真实订单ID<br>2. 执行curl命令<br>3. 检查响应状态和内容 |
| 预期结果 | - 返回200 OK<br> - 响应JSON包含success: true<br> - 响应包含有效的文件URL和正确的recordCount<br> - 导出文件名与请求一致 |

### 测试用例2: 使用浏览器Console导出单个订单（CSV格式）
| 测试项 | 描述 |
|-------|------|
| 测试ID | TC-002 |
| 测试目标 | 验证通过浏览器Console调用Edge Function导出单个订单的功能 |
| 前置条件 | 已打开订单列表页面 |
| 测试步骤 | 1. 在浏览器Console中执行测试脚本，替换<order-id>为真实订单ID<br>2. 检查控制台输出<br>3. 验证文件是否自动打开/下载 |
| 预期结果 | - 控制台输出success: true<br> - 包含有效的文件URL<br> - 浏览器自动打开下载链接 |

### 测试用例3: 验证导出文件（CSV格式）
| 测试项 | 描述 |
|-------|------|
| 测试ID | TC-003 |
| 测试目标 | 验证导出的CSV文件符合要求 |
| 前置条件 | 已成功导出订单文件 |
| 测试步骤 | 1. 下载导出文件<br>2. 用Excel打开文件<br>3. 检查文件编码和中文显示<br>4. 验证表头为中文<br>5. 验证数据完整性 |
| 预期结果 | - 文件可以成功下载<br> - Excel打开后中文显示正常（无乱码）<br> - 表头为中文<br> - 数据与数据库中的订单信息一致 |

### 测试用例4: 测试Edge Function错误处理
| 测试项 | 描述 |
|-------|------|
| 测试ID | TC-004 |
| 测试目标 | 验证Edge Function对无效请求的错误处理 |
| 前置条件 | 准备一个无效的订单ID |
| 测试步骤 | 1. 使用curl发送包含无效订单ID的请求<br>2. 检查响应状态和内容 |
| 预期结果 | - 返回适当的错误状态码<br> - 响应包含明确的错误信息<br> - 不返回500 Internal Server Error（除非是服务器内部错误） |

## 7. 测试执行计划
### 7.1 执行顺序
1. 执行测试数据准备（获取订单ID）
2. 执行TC-001（curl导出单个订单）
3. 执行TC-003（验证导出文件）
4. 执行TC-002（浏览器Console导出单个订单）
5. 执行TC-003（验证导出文件）
6. 执行TC-004（错误处理测试）

### 7.2 执行人员
- 测试负责人: ________________
- 执行人员: ________________

### 7.3 执行时间
- 计划开始时间: ________________
- 计划结束时间: ________________

## 8. 测试结果记录

| 测试用例ID | 测试日期 | 订单ID | 执行方法 | 导出成功 | 文件URL | 中文显示 | 数据完整性 | 问题记录 | 测试人员 |
|------------|----------|--------|----------|----------|---------|----------|------------|----------|----------|
| TC-001 | | | curl | ✅/❌ | | ✅/❌ | ✅/❌ | | |
| TC-002 | | | Browser Console | ✅/❌ | | ✅/❌ | ✅/❌ | | |
| TC-004 | | | curl | ✅/❌ | | N/A | N/A | | |

## 9. 风险评估

| 风险项 | 风险描述 | 影响程度 | 发生概率 | 缓解措施 |
|-------|----------|----------|----------|----------|
| API Key过期 | 用于调用Edge Function的API Key过期 | 高 | 中 | 提前验证API Key有效性，准备备用Key |
| Edge Function未部署 | 测试前Edge Function未正确部署 | 高 | 低 | 测试前检查Supabase Dashboard中的Function状态 |
| 订单ID不存在 | 使用了无效或已删除的订单ID | 中 | 中 | 测试前验证订单ID的有效性，使用最新的订单 |
| 存储桶权限问题 | 导出文件无法上传到Storage或无法下载 | 高 | 中 | 测试前检查Storage bucket的权限设置，确保为Public |
| 中文编码问题 | 导出文件中文显示乱码 | 中 | 中 | 确保Edge Function返回的CSV包含BOM，测试多种打开方式 |

## 10. 附录

### 附录A: SQL查询语句
```sql
-- 获取5个测试订单ID
SELECT id, customer_name, status, total_amount, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;
```

### 附录B: curl命令模板
```bash
# 替换<order-id>为真实ID
curl -X POST \
  https://rdpiajialjnmngnaokix.supabase.co/functions/v1/export-orders \
  -H "Authorization: Bearer sb_secret_5k6RlR3PqftG29R-yakSGg_z1w-JGHs" \
  -H "Content-Type: application/json" \
  -d '{
    "orderIds": [<order-id>],
    "format": "csv",
    "fileName": "test_export.csv"
  }'
```

### 附录C: 浏览器Console脚本
```javascript
// 替换<order-id>为真实ID
const response = await fetch('https://rdpiajialjnmngnaokix.supabase.co/functions/v1/export-orders', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sb_secret_5k6RlR3PqftG29R-yakSGg_z1w-JGHs',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderIds: [<order-id>],
    format: 'csv'
  })
});

const result = await response.json();
console.log(result);

// 如果成功，打开下载链接
if (result.url) {
  window.open(result.url);
}
```

### 附录D: 常见问题排查

**问题1: 401 Unauthorized**
- 检查API Key是否正确
- 确认Edge Function已部署

**问题2: 500 Internal Server Error**
- 在Supabase Dashboard查看Function日志
- 检查order_id是否存在

**问题3: 文件无法下载**
- 检查Storage bucket是否为Public
- 确认文件已上传到Storage

**问题4: 中文乱码**
- 确认Edge Function返回的CSV包含BOM
- 尝试用VSCode打开查看编码

## 11. 测试计划审批

| 角色 | 姓名 | 签名 | 日期 |
|------|------|------|------|
| 测试负责人 | | | |
| 开发负责人 | | | |
| 产品负责人 | | | |

*注: 本测试计划基于提供的功能测试脚本制定，可根据实际情况进行调整和扩展。*