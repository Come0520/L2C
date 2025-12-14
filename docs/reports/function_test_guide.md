# 快速功能测试脚本

## 步骤1: 获取测试订单ID

在Supabase SQL Editor中执行：

```sql
-- 获取5个测试订单ID
SELECT id, customer_name, status, total_amount, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;
```

**记录订单ID**: ________________

---

## 步骤2: 测试Edge Function导出

### 方法1: 使用curl（推荐）

```bash
# 替换<order-id>为上面获取的真实ID
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

**预期响应**:
```json
{
  "success": true,
  "url": "https://...",
  "fileName": "test_export.csv",
  "recordCount": 1
}
```

### 方法2: 在浏览器Console中测试

```javascript
// 打开订单列表页面，在Console中执行
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

---

## 步骤3: 验证导出文件

**检查项**:
- [ ] CSV文件可以下载
- [ ] 文件用Excel打开，中文显示正常（无乱码）
- [ ] 表头为中文
- [ ] 数据完整且正确

---

## 测试结果记录

**测试时间**: ________________  
**订单ID**: ________________  
**导出成功**: ✅ / ❌  
**文件URL**: ________________  
**中文显示**: ✅ / ❌  
**问题记录**: ________________

---

## 如果测试失败

### 常见问题排查

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
