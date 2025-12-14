# 运维部署文档

> L2C 系统的运维和部署文档集合

---

## 📖 核心部署指南

### [deployment-guide.md](./deployment-guide.md) ⭐ **一站式部署文档**

完整的综合部署指南，整合了所有部署流程和最佳实践。

**包含内容**：
- 📋 部署架构方案
- ⚙️ 环境准备
- ⚡ 快速部署（10分钟）
- 📦 完整全新部署
- 🔄 版本更新部署
- 🔧 故障排查
- 📊 维护与监控

**适用场景**：
- ✅ 首次部署
- ✅ 版本更新
- ✅ 故障修复
- ✅ 日常维护

---

## 📁 文档目录

### ☁️ [aliyun/](./aliyun/) - 阿里云配置

- [ecs-setup.md](./aliyun/ecs-setup.md) - ECS 服务器设置指南
- [environment-checklist.md](./aliyun/environment-checklist.md) - 环境配置检查清单

### 🔧 [troubleshooting/](./troubleshooting/) - 故障排查

- [ssh-issues.md](./troubleshooting/ssh-issues.md) - SSH 连接问题解决
- [quick-fixes.md](./troubleshooting/quick-fixes.md) - 快速修复命令

### 📚 [archive/](./archive/) - 归档文档

历史部署文档，供参考查阅：
- DEPLOYMENT_QUICKSTART.md
- FRESH_DEPLOY_GUIDE.md
- WORKBENCH_DEPLOY_COMMANDS.md
- complete-deploy-workbench.md
- final-deployment-steps.md
- fresh-install-deploy.md
- 部署上线建议.md

---

## 🚀 快速开始

### 新手部署流程

1. **阅读综合部署指南**
   - 📖 [deployment-guide.md](./deployment-guide.md)
   
2. **配置阿里云环境**
   - ☁️ [ecs-setup.md](./aliyun/ecs-setup.md)
   - ✅ [environment-checklist.md](./aliyun/environment-checklist.md)

3. **执行部署**
   - 按照部署指南的步骤操作

4. **遇到问题？**
   - 🔍 查看 [troubleshooting/](./troubleshooting/)

---

## 📋 常用操作

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f web-app
```

### 重启服务
```bash
# 重启特定服务
docker-compose restart web-app

# 重启所有服务
docker-compose restart
```

### 执行备份
```bash
/opt/l2c/scripts/backup/full-backup.sh
```

---

## ⚠️ 注意事项

### 部署前检查
- [ ] 已配置阿里云 ECS
- [ ] 域名已解析到 ECS IP
- [ ] SSL 证书已准备好
- [ ] 环境变量已配置
- [ ] 数据库已初始化

### 安全建议
- 🔐 定期更新 SSL 证书（每3个月）
- 💾 每天自动备份数据
- 📊 配置监控告警
- 🔒 及时更新系统补丁

---

## 📞 获取帮助

遇到问题？按以下顺序查找解决方案：

1. **查看综合部署指南** - [deployment-guide.md](./deployment-guide.md)
2. **检查故障排查文档** - [troubleshooting/](./troubleshooting/)
3. **参考历史文档** - [archive/](./archive/)
4. **联系技术支持** - bigeyecome@gmail.com

---

**最后更新**: 2025-12-14  
**维护状态**: 活跃维护
