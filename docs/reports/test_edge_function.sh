#!/bin/bash
# Edge Function测试脚本
# 使用方法: 替换ORDER_ID后执行 bash test_edge_function.sh

# 配置
PROJECT_URL="https://rdpiajialjnmngnaokix.supabase.co"
SECRET_KEY="sb_secret_5k6RlR3PqftG29R-yakSGg_z1w-JGHs"

# 需要替换为真实订单ID
ORDER_ID="替换为真实订单ID"

echo "=========================================="
echo "测试 Edge Function: export-orders"
echo "=========================================="

# 测试CSV导出
echo ""
echo "测试1: CSV格式导出"
echo "------------------------------------------"

curl -X POST \
  "${PROJECT_URL}/functions/v1/export-orders" \
  -H "Authorization: Bearer ${SECRET_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderIds\": [\"${ORDER_ID}\"],
    \"format\": \"csv\",
    \"fileName\": \"test_export.csv\"
  }"

echo ""
echo ""

# 测试多个订单导出
echo "测试2: 多个订单导出"
echo "------------------------------------------"

# 需要替换为真实订单ID列表
ORDER_ID_1="替换ID1"
ORDER_ID_2="替换ID2"

curl -X POST \
  "${PROJECT_URL}/functions/v1/export-orders" \
  -H "Authorization: Bearer ${SECRET_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderIds\": [\"${ORDER_ID_1}\", \"${ORDER_ID_2}\"],
    \"format\": \"csv\",
    \"includeFields\": [
      \"sales_no\",
      \"customer_name\",
      \"status\",
      \"total_amount\"
    ]
  }"

echo ""
echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""
echo "预期结果示例:"
echo "{
  \"success\": true,
  \"url\": \"https://...\",
  \"fileName\": \"test_export.csv\",
  \"recordCount\": 1
}"
echo ""
echo "请检查:"
echo "1. success 为 true"
echo "2. 返回了downloadUrl"
echo "3. 文件可以下载"
echo "4. CSV格式正确，中文无乱码"
