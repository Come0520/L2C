# 阿里云控制台完成部署指南

> **执行时间**: 2025-12-08 20:12  
> **预计耗时**: 5 分钟  
> **方式**: 阿里云 Workbench 网页终端

---

## 📋 操作步骤

### 步骤 1：登录阿里云控制台

1. 打开浏览器，访问：https://ecs.console.aliyun.com/
2. 使用您的阿里云账号登录

---

### 步骤 2：找到 ECS 实例

1. 在左侧菜单选择 **实例与镜像** → **实例**
2. 在实例列表中找到您的服务器
   - **公网IP**: `101.132.152.132`
   - 或通过实例名称查找

---

### 步骤 3：打开远程连接

1. 点击实例右侧的 **远程连接** 按钮
2. 选择 **通过 Workbench 远程连接**
3. 在弹出窗口中：
   - 用户名：`root`
   - 认证方式：选择 **密码** 或 **密钥**
4. 点击 **确定** 进入网页终端

---

### 步骤 4：执行部署命令

在 Workbench 终端中，**复制粘贴**以下命令（一次性执行）：

```bash
cd /opt/l2c/L2C/slideboard-frontend && \
echo "=== 当前目录 ===" && \
pwd && \
echo && \
echo "=== 检查构建状态 ===" && \
ls -lh .next 2>/dev/null | head -5 && \
echo && \
echo "=== 停止旧进程 ===" && \
pm2 delete l2c 2>/dev/null || echo "无旧进程" && \
echo && \
echo "=== 启动应用（带4GB内存限制）===" && \
pm2 start npm --name "l2c" --node-args="--max-old-space-size=4096" -- start && \
pm2 save && \
pm2 startup systemd -u root --hp /root && \
echo && \
echo "=== 等待应用启动（15秒）===" && \
sleep 15 && \
echo && \
echo "=== PM2 状态 ===" && \
pm2 list && \
echo && \
echo "=== 应用日志 ===" && \
pm2 logs l2c --lines 20 --nostream && \
echo && \
echo "=== 测试应用 ===" && \
curl -I http://localhost:3000 && \
echo && \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" && \
echo "✅ 部署完成！" && \
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" && \
echo && \
echo "访问应用：" && \
echo "  🌐 http://101.132.152.132:3000" && \
echo "  🌐 http://www.luolai-sd.xin:3000"
```

---

### 步骤 5：查看结果

命令执行后，检查输出：

**成功标志**：
- ✅ PM2 状态显示 `online`
- ✅ curl 返回 `HTTP/1.1 200 OK`
- ✅ 日志无严重错误

**如果失败**：
- 查看 PM2 日志中的错误信息
- 截图发给我，我会帮您排查

---

### 步骤 6：浏览器测试

打开浏览器，访问：
- http://101.132.152.132:3000
- http://www.luolai-sd.xin:3000

如果能看到应用页面 → **部署成功！**🎉

---

## 🔧 常用管理命令

**查看状态**：
```bash
pm2 list
```

**查看日志**：
```bash
pm2 logs l2c
pm2 logs l2c --lines 100
```

**重启应用**：
```bash
pm2 restart l2c
```

**停止应用**：
```bash
pm2 stop l2c
```

**删除应用**：
```bash
pm2 delete l2c
```

---

## ⚠️ 可能遇到的问题

### 问题 1：.next 目录不存在

**原因**：构建未完成或失败

**解决**：
```bash
cd /opt/l2c/L2C/slideboard-frontend
export NODE_OPTIONS="--max-old-space-size=4096"
NODE_ENV=production npm run build
```

构建完成后，重新执行步骤4的启动命令。

---

### 问题 2：应用不断重启

**原因**：代码错误或配置问题

**解决**：
```bash
pm2 logs l2c --lines 50
```

查看错误日志，将错误信息发给我。

---

### 问题 3：端口 3000 无法访问

**原因**：防火墙未开放

**解决**：
```bash
# 检查防火墙
ufw status

# 开放端口
ufw allow 3000/tcp

# 或检查阿里云安全组规则
```

---

## 📞 完成后告诉我

请告诉我以下信息：

1. **PM2 状态**：online 还是其他？
2. **curl 测试结果**：HTTP 200 还是其他？
3. **浏览器访问**：能否看到应用？
4. **截图**（如果有问题）

我会帮您创建最终的成功报告！🚀

---

**提示**：所有命令都可以直接复制粘贴，无需修改！
