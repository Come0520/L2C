# 🚀 L2C 快速修复指南

## 问题诊断 ✅

**错误原因：** 构建未完成，`.next`目录不存在

**错误日志：**
```
Error: Could not find a production build in the '.next' directory.
```

---

## 方案1：使用修复脚本（推荐）⭐

### 步骤1：上传脚本
将 `fix-build-and-deploy.sh` 上传到服务器

### 步骤2：执行脚本
```bash
cd /opt/l2c/L2C/slideboard-frontend
chmod +x fix-build-and-deploy.sh
./fix-build-and-deploy.sh
```

---

## 方案2：手动执行命令

在阿里云 Workbench 中依次执行：

### 1️⃣ 停止应用
```bash
pm2 stop l2c
pm2 delete l2c
```

### 2️⃣ 进入目录并清理
```bash
cd /opt/l2c/L2C/slideboard-frontend
rm -rf .next
```

### 3️⃣ 重新构建（关键）
```bash
export NODE_OPTIONS="--max-old-space-size=6144"
NODE_ENV=production npm run build
```

**⏳ 等待10-15分钟完成构建**

### 4️⃣ 验证构建
```bash
ls -la .next
```
应该看到很多文件和目录

### 5️⃣ 启动应用
```bash
pm2 start npm --name "l2c" --node-args="--max-old-space-size=4096" -- start
pm2 save
```

### 6️⃣ 等待并验证
```bash
sleep 15
pm2 list
curl -I http://localhost:3000
```

---

## 方案3：一键命令（复制粘贴）

```bash
cd /opt/l2c/L2C/slideboard-frontend && \
pm2 stop l2c 2>/dev/null; pm2 delete l2c 2>/dev/null; \
rm -rf .next && \
export NODE_OPTIONS="--max-old-space-size=6144" && \
echo "开始构建，请等待10-15分钟..." && \
NODE_ENV=production npm run build && \
echo "构建完成，启动应用..." && \
pm2 start npm --name "l2c" --node-args="--max-old-space-size=4096" -- start && \
pm2 save && \
sleep 15 && \
echo "=== PM2 状态 ===" && pm2 list && \
echo "=== 健康检查 ===" && curl -I http://localhost:3000
```

---

## ✅ 成功标志

部署成功后应该看到：

1. **PM2状态：**
   - 状态：`online`
   - 重启次数：`0`或很低
   - 运行时间：持续增长（如`2m`, `5m`...）

2. **健康检查：**
   ```
   HTTP/1.1 200 OK
   ```

3. **可以访问：**
   - http://101.132.152.132:3000
   - http://www.luolai-sd.xin:3000

---

## ⚠️ 注意事项

1. **构建时间**：根据服务器性能，构建可能需要10-20分钟
2. **内存监控**：如果构建失败，检查内存是否足够
3. **日志查看**：如有问题，使用 `pm2 logs l2c --err`

---

## 🔍 如果构建失败

查看构建日志：
```bash
cat /opt/l2c/L2C/slideboard-frontend/build.log
```

常见问题：
- **内存不足**：尝试减少其他进程
- **磁盘空间不足**：清理不需要的文件 `df -h`
- **依赖问题**：重新安装 `npm install --production`
