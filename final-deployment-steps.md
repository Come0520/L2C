# L2C 部署最终验证步骤

> **执行时间**: 2025-12-08 19:52  
> **执行方式**: SSH 手动登录

---

## 🎯 完整验证步骤

### 步骤 1：SSH 登录服务器

```bash
ssh -i ~/.ssh/ecs-l2c-deploy root@101.132.152.132
```

---

### 步骤 2：检查构建状态

```bash
# 进入项目目录
cd /opt/l2c/L2C/slideboard-frontend

# 检查是否有构建进程在运行
ps aux | grep "next build" | grep -v grep

# 如果有进程：等待构建完成
# 如果没有进程：继续下一步
```

---

### 步骤 3：验证构建结果

```bash
# 检查 .next 目录是否存在
ls -lh .next

# 查看构建日志（如果有）
tail -50 /tmp/build.log

# 如果 .next 目录存在且没有错误 → 构建成功 ✅
# 如果 .next 目录不存在 → 需要重新构建
```

---

### 步骤 4：启动应用

```bash
# 停止旧的PM2进程（如果有）
pm2 delete l2c 2>/dev/null || true

# 启动应用（带内存限制）
pm2 start npm --name "l2c" --node-args="--max-old-space-size=4096" -- start

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup systemd -u root --hp /root
```

---

### 步骤 5：验证应用运行

```bash
# 等待15秒让应用启动
sleep 15

# 查看PM2状态
pm2 list

# 查看应用日志
pm2 logs l2c --lines 30

# 测试端口3000
curl -I http://localhost:3000

# 如果看到 HTTP 200 响应 → 成功！✅
```

---

### 步骤 6：外部访问测试

```bash
# 检查防火墙（确保3000端口开放）
ufw status

# 如果端口未开放，执行：
# ufw allow 3000/tcp
```

然后在浏览器访问：
- `http://101.132.152.132:3000`
- `http://www.luolai-sd.xin:3000`

---

## 🔧 如果构建失败

如果 .next 目录不存在，重新构建：

```bash
cd /opt/l2c/L2C/slideboard-frontend

# 设置内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 重新构建
NODE_ENV=production npm run build

# 查看构建过程
# 如果成功，返回步骤4启动应用
```

---

## 🆘 常见问题

### 问题1：构建时内存不足

**症状**: `JavaScript heap out of memory`

**解决**:
```bash
# 增加到6GB（如果服务器内存够）
export NODE_OPTIONS="--max-old-space-size=6144"
npm run build
```

### 问题2：应用启动后立即崩溃

**症状**: PM2显示不断重启

**解决**:
```bash
# 查看详细错误
pm2 logs l2c --lines 50

# 检查环境变量
cat .env.production

# 确保所有必要的环境变量都已设置
```

### 问题3：端口3000无法访问

**症状**: `Connection refused`

**解决**:
```bash
# 检查端口占用
netstat -tlnp | grep 3000

# 检查应用是否真的在运行
pm2 list
ps aux | grep node

# 检查防火墙
ufw status
```

---

## ✅ 成功标志

当您看到以下内容时，部署成功：

1. `pm2 list` 显示状态为 **online**
2. `curl http://localhost:3000` 返回 **HTTP 200**
3. 浏览器可以访问应用
4. PM2日志无错误

---

## 📞 完成后

部署成功后，告诉我结果，我会：
- 更新部署文档
- 创建最终的验证报告
- 提供后续维护建议

祝您成功！🚀
