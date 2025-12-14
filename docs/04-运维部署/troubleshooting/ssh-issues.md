# SSH 连接故障排查

## 问题：SSH 连接无响应

服务器网络正常（ping通），但SSH连接卡住。

---

## 解决方案

### 方案 1：使用详细模式重新连接（推荐）

```bash
# 在当前终端按 Ctrl+C 终止
# 然后使用详细模式重新连接
ssh -v -i ~/.ssh/ecs-l2c-deploy root@101.132.152.132
```

`-v` 参数会显示连接过程，帮助诊断问题。

---

### 方案 2：使用旧密钥连接

```bash
# 使用原来的密钥（需要输入密码）
ssh -i /Users/laichangcheng/Downloads/罗莱-圣都.pem root@101.132.152.132
```

---

### 方案 3：添加连接选项

```bash
# 增加超时时间和连接选项
ssh -i ~/.ssh/ecs-l2c-deploy \
    -o ConnectTimeout=30 \
    -o ServerAliveInterval=60 \
    -o StrictHostKeyChecking=no \
    root@101.132.152.132
```

---

### 方案 4：检查SSH配置

```bash
# 查看SSH密钥权限
ls -l ~/.ssh/ecs-l2c-deploy

# 权限应该是 600
chmod 600 ~/.ssh/ecs-l2c-deploy

# 重试连接
ssh -i ~/.ssh/ecs-l2c-deploy root@101.132.152.132
```

---

## 快速验证命令

如果能连上，立即执行：

```bash
cd /opt/l2c/L2C/slideboard-frontend && \
pm2 delete l2c 2>/dev/null; \
pm2 start npm --name "l2c" --node-args="--max-old-space-size=4096" -- start && \
pm2 save && \
sleep 10 && \
pm2 list && \
curl -I http://localhost:3000
```

这会一次性完成所有验证步骤。
