# 罗莱L2C销售管理系统 - Docker容器化和Kubernetes部署方案

## 📋 文档概述

**项目名称：** 罗莱L2C销售管理系统容器化部署方案  
**文档版本：** v1.0  
**创建日期：** 2024年  
**设计目标：** 构建高可用、可扩展、易维护的容器化部署架构  

---

## 🎯 部署目标与价值

### 1. 核心目标
- **环境一致性**：开发、测试、生产环境完全一致
- **快速部署**：支持快速部署和回滚
- **弹性伸缩**：根据负载自动扩缩容
- **高可用性**：99.9%系统可用性保障
- **资源优化**：合理利用计算资源，降低成本

### 2. 技术架构
- **容器化**：Docker + Docker Compose
- **编排平台**：Kubernetes (K8s)
- **服务网格**：Istio（可选）
- **监控体系**：Prometheus + Grafana
- **日志收集**：ELK Stack
- **镜像仓库**：Harbor

---

## 🐳 Docker容器化设计

### 1. 应用容器化

#### 1.1 前端应用容器化
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY yarn.lock ./

# 安装依赖
RUN yarn install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN yarn build

# 生产环境镜像
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动命令
CMD ["nginx", "-g", "daemon off;"]
```

#### 1.2 后端应用容器化
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY yarn.lock ./

# 安装依赖
RUN yarn install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN yarn build

# 生产环境镜像
FROM node:18-alpine

# 创建应用用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# 切换用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "dist/main.js"]
```

#### 1.3 数据库容器化
```dockerfile
# database/Dockerfile
FROM postgres:15-alpine

# 设置环境变量
ENV POSTGRES_DB=crm_db
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

# 复制初始化脚本
COPY init-scripts/ /docker-entrypoint-initdb.d/

# 复制配置文件
COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY pg_hba.conf /etc/postgresql/pg_hba.conf

# 暴露端口
EXPOSE 5432

# 数据卷
VOLUME ["/var/lib/postgresql/data"]
```

### 2. Docker Compose配置

#### 2.1 开发环境配置
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - REACT_APP_API_URL=http://localhost:4000
    depends_on:
      - backend

  # 后端服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "4000:4000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/crm_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  # 数据库服务
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=crm_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init-scripts:/docker-entrypoint-initdb.d

  # Redis缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # Elasticsearch
  elasticsearch:
    image: elasticsearch:8.8.0
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
```

#### 2.2 生产环境配置
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    depends_on:
      - backend

  # 后端服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    depends_on:
      - postgres
      - redis

  # 数据库服务
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/backup:/backup
    restart: unless-stopped

  # Redis缓存
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

  # Nginx负载均衡
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 3. 镜像优化策略

#### 3.1 多阶段构建优化
```dockerfile
# 优化后的后端Dockerfile
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM node:18-alpine AS runtime
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# 只复制必要文件
COPY --from=dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs
EXPOSE 3000

# 优化的健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
```

#### 3.2 镜像安全配置
```dockerfile
# 安全优化的Dockerfile
FROM node:18-alpine

# 更新系统包
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# 设置工作目录
WORKDIR /app

# 复制应用文件
COPY --chown=nextjs:nodejs . .

# 安装依赖
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

# 移除不必要的包
RUN apk del .build-deps

# 切换到非root用户
USER nextjs

# 使用dumb-init作为PID 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

---

## ☸️ Kubernetes部署配置

### 1. 命名空间和资源配置

#### 1.1 命名空间定义
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: crm-system
  labels:
    name: crm-system
    environment: production
---
apiVersion: v1
kind: Namespace
metadata:
  name: crm-system-staging
  labels:
    name: crm-system-staging
    environment: staging
```

#### 1.2 ConfigMap配置
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: crm-config
  namespace: crm-system
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  API_VERSION: "v1"
  CORS_ORIGIN: "https://crm.luolai.com"
  SESSION_TIMEOUT: "3600"
  
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
  namespace: crm-system
data:
  nginx.conf: |
    upstream backend {
        server crm-backend:3000;
    }
    
    server {
        listen 80;
        server_name crm.luolai.com;
        
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }
        
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
```

#### 1.3 Secret配置
```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: crm-secrets
  namespace: crm-system
type: Opaque
data:
  DATABASE_URL: cG9zdGdyZXNxbDovL3VzZXI6cGFzc3dvcmRAcG9zdGdyZXM6NTQzMi9jcm1fZGI=
  JWT_SECRET: bXlfc3VwZXJfc2VjcmV0X2p3dF9rZXk=
  REDIS_PASSWORD: cmVkaXNfcGFzc3dvcmQ=
  
---
apiVersion: v1
kind: Secret
metadata:
  name: tls-secret
  namespace: crm-system
type: kubernetes.io/tls
data:
  tls.crt: LS0tLS1CRUdJTi... # base64编码的证书
  tls.key: LS0tLS1CRUdJTi... # base64编码的私钥
```

### 2. 应用部署配置

#### 2.1 后端服务部署
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crm-backend
  namespace: crm-system
  labels:
    app: crm-backend
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: crm-backend
  template:
    metadata:
      labels:
        app: crm-backend
        version: v1
    spec:
      containers:
      - name: backend
        image: harbor.luolai.com/crm/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: crm-config
              key: NODE_ENV
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: crm-secrets
              key: DATABASE_URL
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: crm-secrets
              key: JWT_SECRET
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: logs
        emptyDir: {}
      
---
apiVersion: v1
kind: Service
metadata:
  name: crm-backend
  namespace: crm-system
spec:
  selector:
    app: crm-backend
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

#### 2.2 前端服务部署
```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crm-frontend
  namespace: crm-system
  labels:
    app: crm-frontend
    version: v1
spec:
  replicas: 2
  selector:
    matchLabels:
      app: crm-frontend
  template:
    metadata:
      labels:
        app: crm-frontend
        version: v1
    spec:
      containers:
      - name: frontend
        image: harbor.luolai.com/crm/frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: nginx-config
          mountPath: /etc/nginx/nginx.conf
          subPath: nginx.conf
      volumes:
      - name: nginx-config
        configMap:
          name: nginx-config

---
apiVersion: v1
kind: Service
metadata:
  name: crm-frontend
  namespace: crm-system
spec:
  selector:
    app: crm-frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

#### 2.3 数据库部署（StatefulSet）
```yaml
# k8s/postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: crm-system
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: "crm_db"
        - name: POSTGRES_USER
          value: "postgres"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 5
          periodSeconds: 5
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: "fast-ssd"
      resources:
        requests:
          storage: 20Gi

---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: crm-system
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```

### 3. 自动扩缩容配置

#### 3.1 HPA配置
```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: crm-backend-hpa
  namespace: crm-system
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: crm-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: crm-frontend-hpa
  namespace: crm-system
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: crm-frontend
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
```

#### 3.2 VPA配置
```yaml
# k8s/vpa.yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: crm-backend-vpa
  namespace: crm-system
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: crm-backend
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: backend
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 1000m
        memory: 1Gi
      controlledResources: ["cpu", "memory"]
```

### 4. 网络和安全配置

#### 4.1 Ingress配置
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: crm-ingress
  namespace: crm-system
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/rewrite-target: /$1
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - crm.luolai.com
    secretName: tls-secret
  rules:
  - host: crm.luolai.com
    http:
      paths:
      - path: /api/(.*)
        pathType: Prefix
        backend:
          service:
            name: crm-backend
            port:
              number: 3000
      - path: /(.*)
        pathType: Prefix
        backend:
          service:
            name: crm-frontend
            port:
              number: 80
```

#### 4.2 网络策略
```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: crm-network-policy
  namespace: crm-system
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    - podSelector:
        matchLabels:
          app: crm-frontend
    - podSelector:
        matchLabels:
          app: crm-backend
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
  - to: []
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
```

### 5. 监控和日志配置

#### 5.1 Prometheus监控
```yaml
# k8s/monitoring.yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: crm-backend-monitor
  namespace: crm-system
  labels:
    app: crm-backend
spec:
  selector:
    matchLabels:
      app: crm-backend
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics

---
apiVersion: v1
kind: Service
metadata:
  name: crm-backend-metrics
  namespace: crm-system
  labels:
    app: crm-backend
spec:
  selector:
    app: crm-backend
  ports:
  - name: metrics
    port: 9090
    targetPort: 9090
```

#### 5.2 日志收集配置
```yaml
# k8s/logging.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: crm-system
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         1
        Log_Level     info
        Daemon        off
        Parsers_File  parsers.conf
        HTTP_Server   On
        HTTP_Listen   0.0.0.0
        HTTP_Port     2020

    [INPUT]
        Name              tail
        Path              /var/log/containers/*crm*.log
        Parser            docker
        Tag               kube.*
        Refresh_Interval  5
        Mem_Buf_Limit     50MB
        Skip_Long_Lines   On

    [OUTPUT]
        Name  es
        Match *
        Host  elasticsearch.logging.svc.cluster.local
        Port  9200
        Index crm-logs
        Type  _doc
```

---

## 🚀 部署流程和脚本

### 1. 部署脚本

#### 1.1 一键部署脚本
```bash
#!/bin/bash
# deploy.sh - 一键部署脚本

set -e

# 配置变量
NAMESPACE="crm-system"
ENVIRONMENT=${1:-production}
IMAGE_TAG=${2:-latest}
REGISTRY="harbor.luolai.com/crm"

echo "🚀 开始部署 CRM 系统到 $ENVIRONMENT 环境"

# 检查kubectl连接
if ! kubectl cluster-info > /dev/null 2>&1; then
    echo "❌ 无法连接到 Kubernetes 集群"
    exit 1
fi

# 创建命名空间
echo "📦 创建命名空间..."
kubectl apply -f k8s/namespace.yaml

# 应用配置
echo "⚙️  应用配置文件..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# 部署数据库
echo "🗄️  部署数据库..."
kubectl apply -f k8s/postgres-statefulset.yaml

# 等待数据库就绪
echo "⏳ 等待数据库就绪..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s

# 部署Redis
echo "🔴 部署Redis..."
kubectl apply -f k8s/redis-deployment.yaml

# 部署后端服务
echo "🔧 部署后端服务..."
sed "s|{{IMAGE_TAG}}|$IMAGE_TAG|g" k8s/backend-deployment.yaml | kubectl apply -f -

# 等待后端服务就绪
echo "⏳ 等待后端服务就绪..."
kubectl wait --for=condition=ready pod -l app=crm-backend -n $NAMESPACE --timeout=300s

# 部署前端服务
echo "🎨 部署前端服务..."
sed "s|{{IMAGE_TAG}}|$IMAGE_TAG|g" k8s/frontend-deployment.yaml | kubectl apply -f -

# 部署Ingress
echo "🌐 配置Ingress..."
kubectl apply -f k8s/ingress.yaml

# 配置自动扩缩容
echo "📈 配置自动扩缩容..."
kubectl apply -f k8s/hpa.yaml

# 配置监控
echo "📊 配置监控..."
kubectl apply -f k8s/monitoring.yaml

# 检查部署状态
echo "🔍 检查部署状态..."
kubectl get pods -n $NAMESPACE
kubectl get services -n $NAMESPACE
kubectl get ingress -n $NAMESPACE

echo "✅ 部署完成！"
echo "🌐 访问地址: https://crm.luolai.com"
```

#### 1.2 回滚脚本
```bash
#!/bin/bash
# rollback.sh - 回滚脚本

set -e

NAMESPACE="crm-system"
REVISION=${1:-1}

echo "🔄 开始回滚到版本 $REVISION"

# 回滚后端服务
echo "🔧 回滚后端服务..."
kubectl rollout undo deployment/crm-backend -n $NAMESPACE --to-revision=$REVISION

# 回滚前端服务
echo "🎨 回滚前端服务..."
kubectl rollout undo deployment/crm-frontend -n $NAMESPACE --to-revision=$REVISION

# 等待回滚完成
echo "⏳ 等待回滚完成..."
kubectl rollout status deployment/crm-backend -n $NAMESPACE
kubectl rollout status deployment/crm-frontend -n $NAMESPACE

echo "✅ 回滚完成！"
```

#### 1.3 健康检查脚本
```bash
#!/bin/bash
# health-check.sh - 健康检查脚本

NAMESPACE="crm-system"
BACKEND_URL="https://crm.luolai.com/api/health"
FRONTEND_URL="https://crm.luolai.com"

echo "🏥 开始健康检查..."

# 检查Pod状态
echo "📦 检查Pod状态..."
kubectl get pods -n $NAMESPACE

# 检查服务状态
echo "🔧 检查服务状态..."
kubectl get services -n $NAMESPACE

# 检查后端健康状态
echo "🔍 检查后端健康状态..."
if curl -f $BACKEND_URL > /dev/null 2>&1; then
    echo "✅ 后端服务健康"
else
    echo "❌ 后端服务异常"
fi

# 检查前端健康状态
echo "🔍 检查前端健康状态..."
if curl -f $FRONTEND_URL > /dev/null 2>&1; then
    echo "✅ 前端服务健康"
else
    echo "❌ 前端服务异常"
fi

# 检查资源使用情况
echo "📊 检查资源使用情况..."
kubectl top pods -n $NAMESPACE

echo "🏥 健康检查完成！"
```

### 2. CI/CD集成

#### 2.1 GitLab CI配置
```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy

variables:
  DOCKER_REGISTRY: harbor.luolai.com
  PROJECT_NAME: crm
  KUBECONFIG: /etc/deploy/config

build:
  stage: build
  script:
    - docker build -t $DOCKER_REGISTRY/$PROJECT_NAME/backend:$CI_COMMIT_SHA ./backend
    - docker build -t $DOCKER_REGISTRY/$PROJECT_NAME/frontend:$CI_COMMIT_SHA ./frontend
    - docker push $DOCKER_REGISTRY/$PROJECT_NAME/backend:$CI_COMMIT_SHA
    - docker push $DOCKER_REGISTRY/$PROJECT_NAME/frontend:$CI_COMMIT_SHA
  only:
    - main
    - develop

test:
  stage: test
  script:
    - npm test
    - npm run test:e2e
  only:
    - main
    - develop

deploy_staging:
  stage: deploy
  script:
    - ./scripts/deploy.sh staging $CI_COMMIT_SHA
  environment:
    name: staging
    url: https://crm-staging.luolai.com
  only:
    - develop

deploy_production:
  stage: deploy
  script:
    - ./scripts/deploy.sh production $CI_COMMIT_SHA
  environment:
    name: production
    url: https://crm.luolai.com
  when: manual
  only:
    - main
```

这个完整的Docker容器化和Kubernetes部署方案提供了从开发到生产的全流程容器化解决方案，确保系统的高可用性、可扩展性和易维护性。
