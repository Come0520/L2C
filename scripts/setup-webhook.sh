#!/bin/bash
# ============================================================
# Webhook 服务一键安装脚本
# 用法：bash scripts/setup-webhook.sh
# 功能：在 ECS（CentOS 7）上安装 adnanh/webhook，配置 systemd 服务
# 前提：SSH alias "ecs" 已配置，且有 root 权限
# ============================================================

set -e

# === 配置 ===
WEBHOOK_VERSION="2.8.1"
ECS_SSH="ecs"
WEBHOOK_PORT="9000"
HOOKS_DIR="/etc/webhook"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

echo "==========================================="
echo "   L2C Webhook 服务安装脚本"
echo "   adnanh/webhook v${WEBHOOK_VERSION}"
echo "==========================================="

# 生成随机 Secret（如果尚未设置）
echo ""
log_warn "请输入 Webhook Secret（将用于 Codeup 和 hooks.json 签名验证）"
log_warn "建议使用随机强密码，例如: $(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | head -c 32 | base64 | tr -d '=+/' | head -c 40)"
read -p "Secret（直接回车生成随机值）: " WEBHOOK_SECRET
if [ -z "$WEBHOOK_SECRET" ]; then
  WEBHOOK_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-secret-$(date +%s)")
  log_info "已生成随机 Secret: $WEBHOOK_SECRET"
fi
echo ""
log_warn "⚠️  请将以上 Secret 保存好，需要在 Codeup Webhook 配置中填写相同的值！"
echo ""

# 输出将要执行的远程命令
log_info "开始在 ECS 上安装 webhook 服务..."

ssh "$ECS_SSH" bash -s << REMOTE_SCRIPT
set -e

# 颜色
GREEN='\033[0;32m'
NC='\033[0m'
log() { echo -e "\${GREEN}[ECS]\${NC} \$1"; }

# 1. 下载并安装 webhook 二进制
log "步骤 1: 下载 adnanh/webhook v${WEBHOOK_VERSION}..."
cd /tmp
curl -fL "https://github.com/adnanh/webhook/releases/download/${WEBHOOK_VERSION}/webhook-linux-amd64.tar.gz" -o webhook.tar.gz
tar -xzf webhook.tar.gz
mv webhook-linux-amd64/webhook /usr/local/bin/webhook
chmod +x /usr/local/bin/webhook
/usr/local/bin/webhook --version
log "Webhook 二进制安装完成 ✓"

# 2. 创建配置目录
log "步骤 2: 创建配置目录..."
mkdir -p ${HOOKS_DIR}

# 3. 写入 hooks.json（含 HMAC-SHA256 签名验证 + main 分支过滤）
log "步骤 3: 写入 hooks.json..."
cat > ${HOOKS_DIR}/hooks.json << 'HOOKSJSON'
[
  {
    "id": "deploy",
    "execute-command": "/root/deploy.sh",
    "command-working-directory": "/root/L2C",
    "response-message": "Deployment triggered successfully",
    "pass-arguments-to-command": [
      {
        "source": "payload",
        "name": "ref"
      }
    ],
    "trigger-rule": {
      "and": [
        {
          "match": {
            "type": "payload-hmac-sha256",
            "secret": "WEBHOOK_SECRET_PLACEHOLDER",
            "parameter": {
              "source": "header",
              "name": "X-Codeup-Token"
            }
          }
        },
        {
          "match": {
            "type": "value",
            "value": "refs/heads/main",
            "parameter": {
              "source": "payload",
              "name": "ref"
            }
          }
        }
      ]
    }
  }
]
HOOKSJSON

# 替换 Secret 占位符
sed -i "s/WEBHOOK_SECRET_PLACEHOLDER/${WEBHOOK_SECRET}/g" ${HOOKS_DIR}/hooks.json
log "hooks.json 写入完成 ✓"

# 4. 写入 systemd 服务文件
log "步骤 4: 创建 systemd 服务..."
cat > /etc/systemd/system/webhook.service << 'SYSTEMD'
[Unit]
Description=Webhook Receiver for L2C Auto Deploy
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/webhook -hooks /etc/webhook/hooks.json -port ${WEBHOOK_PORT} -verbose -logfile /var/log/webhook.log
Restart=always
RestartSec=5
StandardOutput=append:/var/log/webhook.log
StandardError=append:/var/log/webhook.log

[Install]
WantedBy=multi-user.target
SYSTEMD

systemctl daemon-reload
systemctl enable webhook
systemctl start webhook
sleep 2
systemctl status webhook --no-pager
log "systemd 服务配置完成 ✓"

# 5. 复制 deploy.sh 到 /root/
log "步骤 5: deploy.sh 需要手动上传（见后续步骤）"

# 6. 开放防火墙（CentOS 7 firewalld）
log "步骤 6: 开放 ${WEBHOOK_PORT} 端口..."
if command -v firewall-cmd &>/dev/null; then
  firewall-cmd --permanent --add-port=${WEBHOOK_PORT}/tcp 2>/dev/null || true
  firewall-cmd --reload 2>/dev/null || true
  log "firewalld 已开放 ${WEBHOOK_PORT}/tcp ✓"
else
  log "未检测到 firewalld，跳过防火墙配置"
fi

echo ""
log "====== Webhook 服务安装完成 ======"
log "监听地址: http://0.0.0.0:${WEBHOOK_PORT}/hooks/deploy"
log "日志文件: /var/log/webhook.log"
log "部署日志: /var/log/webhook-deploy.log"
REMOTE_SCRIPT

log_info "ECS webhook 服务安装完成！"
echo ""

# 上传 deploy.sh 到 ECS
log_info "上传 deploy.sh 到 ECS /root/..."
scp scripts/ecs-deploy.sh "${ECS_SSH}:/root/deploy.sh"
ssh "$ECS_SSH" "chmod +x /root/deploy.sh"
log_info "deploy.sh 上传并授权完成 ✓"

echo ""
echo "==========================================="
echo "  安装完成！后续操作："
echo ""
echo "  1. 验证服务：ssh ecs 'systemctl status webhook'"
echo "  2. 在 Codeup 仓库设置 → Webhook 填写："
echo "     URL: http://106.15.43.218:${WEBHOOK_PORT}/hooks/deploy"
echo "     Secret: ${WEBHOOK_SECRET}"
echo "     事件: Push Hook，分支: main"
echo "  3. 推送代码测试：git push codeup main"
echo "  4. 查看日志：ssh ecs 'tail -f /var/log/webhook-deploy.log'"
echo "==========================================="
