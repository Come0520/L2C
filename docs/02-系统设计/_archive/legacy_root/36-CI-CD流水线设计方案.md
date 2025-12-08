# 罗莱L2C销售管理系统 - CI/CD流水线设计方案

## 📋 文档概述

**项目名称：** 罗莱L2C销售管理系统CI/CD流水线  
**文档版本：** v1.0  
**创建日期：** 2024年  
**设计目标：** 构建高效、安全、可靠的持续集成和持续部署流水线  

---

## 🎯 CI/CD目标与价值

### 1. 核心目标
- **快速交付**：从代码提交到生产部署30分钟内完成
- **质量保障**：自动化测试覆盖率达到80%以上
- **安全可靠**：零停机部署，快速回滚能力
- **标准化**：统一的构建、测试、部署流程
- **可观测性**：全流程监控和日志记录

### 2. 技术架构
- **版本控制**：GitLab
- **CI/CD平台**：GitLab CI/CD
- **容器化**：Docker + Harbor镜像仓库
- **编排平台**：Kubernetes
- **监控体系**：Prometheus + Grafana
- **通知系统**：钉钉 + 邮件

---

## 🔄 CI/CD流水线架构

### 1. 整体流程设计

```mermaid
graph TD
    A[代码提交] --> B[代码检查]
    B --> C[单元测试]
    C --> D[代码质量扫描]
    D --> E[构建镜像]
    E --> F[安全扫描]
    F --> G[集成测试]
    G --> H[部署到测试环境]
    H --> I[自动化测试]
    I --> J[性能测试]
    J --> K[部署到预发布环境]
    K --> L[人工验收测试]
    L --> M[部署到生产环境]
    M --> N[健康检查]
    N --> O[监控告警]
```

### 2. 分支策略

#### 2.1 Git Flow分支模型
```yaml
# 分支策略配置
branches:
  main:
    description: "生产环境分支"
    protection:
      - required_reviews: 2
      - dismiss_stale_reviews: true
      - require_code_owner_reviews: true
      - required_status_checks:
        - ci/build
        - ci/test
        - ci/security-scan
    auto_deploy: production
    
  develop:
    description: "开发环境分支"
    protection:
      - required_reviews: 1
      - required_status_checks:
        - ci/build
        - ci/test
    auto_deploy: staging
    
  feature/*:
    description: "功能开发分支"
    auto_deploy: false
    
  hotfix/*:
    description: "紧急修复分支"
    auto_deploy: false
    
  release/*:
    description: "发布准备分支"
    auto_deploy: pre-production
```

### 3. 环境管理策略

#### 3.1 环境配置
```yaml
# 环境配置
environments:
  development:
    cluster: dev-k8s
    namespace: crm-dev
    replicas: 1
    resources:
      cpu: "200m"
      memory: "256Mi"
    auto_deploy: true
    
  staging:
    cluster: staging-k8s
    namespace: crm-staging
    replicas: 2
    resources:
      cpu: "500m"
      memory: "512Mi"
    auto_deploy: true
    approval_required: false
    
  pre-production:
    cluster: prod-k8s
    namespace: crm-preprod
    replicas: 3
    resources:
      cpu: "1000m"
      memory: "1Gi"
    auto_deploy: false
    approval_required: true
    
  production:
    cluster: prod-k8s
    namespace: crm-prod
    replicas: 5
    resources:
      cpu: "1000m"
      memory: "1Gi"
    auto_deploy: false
    approval_required: true
    deployment_strategy: blue-green
```

---

## 🔧 GitLab CI/CD配置

### 1. 主配置文件

#### 1.1 .gitlab-ci.yml
```yaml
# .gitlab-ci.yml
stages:
  - validate
  - build
  - test
  - security
  - package
  - deploy-dev
  - deploy-staging
  - deploy-preprod
  - deploy-prod

variables:
  DOCKER_REGISTRY: harbor.luolai.com
  PROJECT_NAME: crm
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  KUBECONFIG: /etc/deploy/config
  NODE_VERSION: "18"
  POSTGRES_VERSION: "15"

# 全局缓存配置
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .yarn/cache/
    - target/

# 全局前置脚本
before_script:
  - echo "🚀 开始 CI/CD 流水线执行"
  - echo "分支: $CI_COMMIT_REF_NAME"
  - echo "提交: $CI_COMMIT_SHA"
  - echo "环境: $CI_ENVIRONMENT_NAME"

# 全局后置脚本
after_script:
  - echo "✅ CI/CD 流水线执行完成"

include:
  - local: '.gitlab-ci/validate.yml'
  - local: '.gitlab-ci/build.yml'
  - local: '.gitlab-ci/test.yml'
  - local: '.gitlab-ci/security.yml'
  - local: '.gitlab-ci/deploy.yml'
```

### 2. 代码验证阶段

#### 2.1 代码检查配置
```yaml
# .gitlab-ci/validate.yml
lint:frontend:
  stage: validate
  image: node:18-alpine
  script:
    - cd frontend
    - npm ci
    - npm run lint
    - npm run type-check
  artifacts:
    reports:
      junit: frontend/reports/lint-results.xml
    paths:
      - frontend/reports/
    expire_in: 1 week
  only:
    - merge_requests
    - main
    - develop

lint:backend:
  stage: validate
  image: node:18-alpine
  script:
    - cd backend
    - npm ci
    - npm run lint
    - npm run type-check
  artifacts:
    reports:
      junit: backend/reports/lint-results.xml
    paths:
      - backend/reports/
    expire_in: 1 week
  only:
    - merge_requests
    - main
    - develop

code:format:
  stage: validate
  image: node:18-alpine
  script:
    - npm ci
    - npm run format:check
  allow_failure: false
  only:
    - merge_requests

commit:message:
  stage: validate
  image: alpine:latest
  script:
    - apk add --no-cache git
    - |
      if ! echo "$CI_COMMIT_MESSAGE" | grep -qE "^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+"; then
        echo "❌ 提交信息格式不符合规范"
        echo "正确格式: type(scope): description"
        echo "示例: feat(user): add user login functionality"
        exit 1
      fi
  only:
    - merge_requests
```

### 3. 构建阶段

#### 3.1 构建配置
```yaml
# .gitlab-ci/build.yml
build:frontend:
  stage: build
  image: node:18-alpine
  script:
    - cd frontend
    - npm ci
    - npm run build
    - echo "✅ 前端构建完成"
  artifacts:
    paths:
      - frontend/dist/
    expire_in: 1 hour
  cache:
    key: frontend-${CI_COMMIT_REF_SLUG}
    paths:
      - frontend/node_modules/
  only:
    - main
    - develop
    - merge_requests

build:backend:
  stage: build
  image: node:18-alpine
  script:
    - cd backend
    - npm ci
    - npm run build
    - echo "✅ 后端构建完成"
  artifacts:
    paths:
      - backend/dist/
    expire_in: 1 hour
  cache:
    key: backend-${CI_COMMIT_REF_SLUG}
    paths:
      - backend/node_modules/
  only:
    - main
    - develop
    - merge_requests

build:docker:
  stage: build
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $DOCKER_REGISTRY
  script:
    # 构建前端镜像
    - |
      docker build \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VCS_REF=$CI_COMMIT_SHA \
        --build-arg VERSION=$CI_COMMIT_TAG \
        -t $DOCKER_REGISTRY/$PROJECT_NAME/frontend:$CI_COMMIT_SHA \
        -t $DOCKER_REGISTRY/$PROJECT_NAME/frontend:latest \
        ./frontend
    
    # 构建后端镜像
    - |
      docker build \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VCS_REF=$CI_COMMIT_SHA \
        --build-arg VERSION=$CI_COMMIT_TAG \
        -t $DOCKER_REGISTRY/$PROJECT_NAME/backend:$CI_COMMIT_SHA \
        -t $DOCKER_REGISTRY/$PROJECT_NAME/backend:latest \
        ./backend
    
    # 推送镜像
    - docker push $DOCKER_REGISTRY/$PROJECT_NAME/frontend:$CI_COMMIT_SHA
    - docker push $DOCKER_REGISTRY/$PROJECT_NAME/backend:$CI_COMMIT_SHA
    
    # 如果是主分支，推送latest标签
    - |
      if [ "$CI_COMMIT_REF_NAME" = "main" ]; then
        docker push $DOCKER_REGISTRY/$PROJECT_NAME/frontend:latest
        docker push $DOCKER_REGISTRY/$PROJECT_NAME/backend:latest
      fi
  dependencies:
    - build:frontend
    - build:backend
  only:
    - main
    - develop
```

### 4. 测试阶段

#### 4.1 测试配置
```yaml
# .gitlab-ci/test.yml
test:unit:frontend:
  stage: test
  image: node:18-alpine
  services:
    - name: postgres:15-alpine
      alias: postgres
  variables:
    POSTGRES_DB: test_db
    POSTGRES_USER: test_user
    POSTGRES_PASSWORD: test_password
  script:
    - cd frontend
    - npm ci
    - npm run test:unit -- --coverage --watchAll=false
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      junit: frontend/reports/junit.xml
      coverage_report:
        coverage_format: cobertura
        path: frontend/coverage/cobertura-coverage.xml
    paths:
      - frontend/coverage/
    expire_in: 1 week
  only:
    - main
    - develop
    - merge_requests

test:unit:backend:
  stage: test
  image: node:18-alpine
  services:
    - name: postgres:15-alpine
      alias: postgres
    - name: redis:7-alpine
      alias: redis
  variables:
    POSTGRES_DB: test_db
    POSTGRES_USER: test_user
    POSTGRES_PASSWORD: test_password
    REDIS_URL: redis://redis:6379
    DATABASE_URL: postgresql://test_user:test_password@postgres:5432/test_db
  script:
    - cd backend
    - npm ci
    - npm run test:unit -- --coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      junit: backend/reports/junit.xml
      coverage_report:
        coverage_format: cobertura
        path: backend/coverage/cobertura-coverage.xml
    paths:
      - backend/coverage/
    expire_in: 1 week
  only:
    - main
    - develop
    - merge_requests

test:integration:
  stage: test
  image: docker/compose:latest
  services:
    - docker:20.10.16-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - docker-compose -f docker-compose.test.yml up -d
    - docker-compose -f docker-compose.test.yml exec -T backend npm run test:integration
    - docker-compose -f docker-compose.test.yml down
  artifacts:
    reports:
      junit: backend/reports/integration-test-results.xml
    expire_in: 1 week
  dependencies:
    - build:docker
  only:
    - main
    - develop

test:e2e:
  stage: test
  image: cypress/included:12.17.0
  services:
    - docker:20.10.16-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - docker-compose -f docker-compose.test.yml up -d
    - sleep 30  # 等待服务启动
    - cypress run --config baseUrl=http://localhost:3000
    - docker-compose -f docker-compose.test.yml down
  artifacts:
    when: always
    paths:
      - cypress/screenshots/
      - cypress/videos/
    reports:
      junit: cypress/reports/junit.xml
    expire_in: 1 week
  dependencies:
    - build:docker
  only:
    - main
    - develop
```

### 5. 安全扫描阶段

#### 5.1 安全扫描配置
```yaml
# .gitlab-ci/security.yml
security:dependency:scan:
  stage: security
  image: node:18-alpine
  script:
    - npm audit --audit-level=high
    - cd frontend && npm audit --audit-level=high
    - cd ../backend && npm audit --audit-level=high
  allow_failure: true
  artifacts:
    reports:
      dependency_scanning: gl-dependency-scanning-report.json
  only:
    - main
    - develop
    - merge_requests

security:sast:
  stage: security
  image: returntocorp/semgrep:latest
  script:
    - semgrep --config=auto --json --output=gl-sast-report.json .
  artifacts:
    reports:
      sast: gl-sast-report.json
  allow_failure: true
  only:
    - main
    - develop
    - merge_requests

security:container:scan:
  stage: security
  image: aquasec/trivy:latest
  script:
    - trivy image --format json --output gl-container-scanning-report.json $DOCKER_REGISTRY/$PROJECT_NAME/frontend:$CI_COMMIT_SHA
    - trivy image --format json --output gl-container-scanning-backend-report.json $DOCKER_REGISTRY/$PROJECT_NAME/backend:$CI_COMMIT_SHA
  artifacts:
    reports:
      container_scanning: 
        - gl-container-scanning-report.json
        - gl-container-scanning-backend-report.json
  dependencies:
    - build:docker
  allow_failure: true
  only:
    - main
    - develop

security:license:scan:
  stage: security
  image: licensefinder/license_finder:latest
  script:
    - license_finder --decisions-file=.license_finder.yml
  artifacts:
    reports:
      license_scanning: gl-license-scanning-report.json
  allow_failure: true
  only:
    - main
    - develop
    - merge_requests
```

### 6. 部署阶段

#### 6.1 部署配置
```yaml
# .gitlab-ci/deploy.yml
.deploy_template: &deploy_template
  image: bitnami/kubectl:latest
  before_script:
    - echo $KUBE_CONFIG | base64 -d > $KUBECONFIG
    - kubectl version --client
  script:
    - |
      # 更新镜像标签
      sed -i "s|{{IMAGE_TAG}}|$CI_COMMIT_SHA|g" k8s/$ENVIRONMENT/*.yaml
      
      # 应用配置
      kubectl apply -f k8s/$ENVIRONMENT/
      
      # 等待部署完成
      kubectl rollout status deployment/crm-backend -n crm-$ENVIRONMENT --timeout=600s
      kubectl rollout status deployment/crm-frontend -n crm-$ENVIRONMENT --timeout=600s
      
      # 健康检查
      ./scripts/health-check.sh $ENVIRONMENT
  after_script:
    - rm -f $KUBECONFIG

deploy:development:
  <<: *deploy_template
  stage: deploy-dev
  variables:
    ENVIRONMENT: dev
  environment:
    name: development
    url: https://crm-dev.luolai.com
    on_stop: stop:development
  dependencies:
    - build:docker
  only:
    - develop

deploy:staging:
  <<: *deploy_template
  stage: deploy-staging
  variables:
    ENVIRONMENT: staging
  environment:
    name: staging
    url: https://crm-staging.luolai.com
    on_stop: stop:staging
  dependencies:
    - test:unit:frontend
    - test:unit:backend
    - test:integration
    - security:dependency:scan
  only:
    - develop

deploy:pre-production:
  <<: *deploy_template
  stage: deploy-preprod
  variables:
    ENVIRONMENT: preprod
  environment:
    name: pre-production
    url: https://crm-preprod.luolai.com
  when: manual
  dependencies:
    - test:e2e
    - security:container:scan
  only:
    - main

deploy:production:
  stage: deploy-prod
  image: bitnami/kubectl:latest
  variables:
    ENVIRONMENT: prod
  before_script:
    - echo $KUBE_CONFIG_PROD | base64 -d > $KUBECONFIG
    - kubectl version --client
  script:
    # 蓝绿部署策略
    - |
      # 检查当前活跃版本
      CURRENT_VERSION=$(kubectl get service crm-frontend -n crm-prod -o jsonpath='{.spec.selector.version}')
      if [ "$CURRENT_VERSION" = "blue" ]; then
        NEW_VERSION="green"
      else
        NEW_VERSION="blue"
      fi
      
      echo "当前版本: $CURRENT_VERSION"
      echo "新版本: $NEW_VERSION"
      
      # 部署新版本
      sed -i "s|{{IMAGE_TAG}}|$CI_COMMIT_SHA|g" k8s/prod/*.yaml
      sed -i "s|{{VERSION}}|$NEW_VERSION|g" k8s/prod/*.yaml
      
      kubectl apply -f k8s/prod/
      
      # 等待新版本就绪
      kubectl rollout status deployment/crm-backend-$NEW_VERSION -n crm-prod --timeout=600s
      kubectl rollout status deployment/crm-frontend-$NEW_VERSION -n crm-prod --timeout=600s
      
      # 健康检查
      ./scripts/health-check.sh prod $NEW_VERSION
      
      # 切换流量
      kubectl patch service crm-frontend -n crm-prod -p '{"spec":{"selector":{"version":"'$NEW_VERSION'"}}}'
      kubectl patch service crm-backend -n crm-prod -p '{"spec":{"selector":{"version":"'$NEW_VERSION'"}}}'
      
      echo "✅ 生产环境部署完成，版本: $NEW_VERSION"
      
      # 等待5分钟后清理旧版本
      sleep 300
      kubectl delete deployment crm-backend-$CURRENT_VERSION -n crm-prod
      kubectl delete deployment crm-frontend-$CURRENT_VERSION -n crm-prod
  environment:
    name: production
    url: https://crm.luolai.com
  when: manual
  dependencies:
    - deploy:pre-production
  only:
    - main

# 停止环境
stop:development:
  image: bitnami/kubectl:latest
  stage: deploy-dev
  variables:
    ENVIRONMENT: dev
    GIT_STRATEGY: none
  script:
    - echo $KUBE_CONFIG | base64 -d > $KUBECONFIG
    - kubectl delete namespace crm-dev
  environment:
    name: development
    action: stop
  when: manual
  only:
    - develop

stop:staging:
  image: bitnami/kubectl:latest
  stage: deploy-staging
  variables:
    ENVIRONMENT: staging
    GIT_STRATEGY: none
  script:
    - echo $KUBE_CONFIG | base64 -d > $KUBECONFIG
    - kubectl delete namespace crm-staging
  environment:
    name: staging
    action: stop
  when: manual
  only:
    - develop
```

---

## 📊 质量门禁配置

### 1. 代码质量门禁

#### 1.1 SonarQube配置
```yaml
# sonar-project.properties
sonar.projectKey=luolai-crm
sonar.projectName=罗莱CRM系统
sonar.projectVersion=1.0

# 源码路径
sonar.sources=frontend/src,backend/src
sonar.tests=frontend/src,backend/src
sonar.test.inclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts

# 排除文件
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**

# 覆盖率报告
sonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info,backend/coverage/lcov.info

# 质量门禁
sonar.qualitygate.wait=true

# TypeScript配置
sonar.typescript.node=node
```

#### 1.2 质量门禁规则
```yaml
# 质量门禁配置
quality_gates:
  code_coverage:
    minimum: 80%
    fail_on_decrease: true
    
  duplicated_lines:
    maximum: 3%
    
  maintainability_rating:
    minimum: A
    
  reliability_rating:
    minimum: A
    
  security_rating:
    minimum: A
    
  technical_debt:
    maximum: 5%
    
  code_smells:
    maximum: 0
    
  bugs:
    maximum: 0
    
  vulnerabilities:
    maximum: 0
```

### 2. 性能测试门禁

#### 2.1 性能测试配置
```yaml
# performance-test.yml
performance_test:
  stage: test
  image: loadimpact/k6:latest
  script:
    - k6 run --out json=performance-results.json performance-tests/load-test.js
    - k6 run --out json=stress-results.json performance-tests/stress-test.js
  artifacts:
    reports:
      performance: performance-results.json
    paths:
      - performance-results.json
      - stress-results.json
  only:
    - main
    - develop

# K6性能测试脚本
# performance-tests/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // 2分钟内增加到100用户
    { duration: '5m', target: 100 }, // 保持100用户5分钟
    { duration: '2m', target: 200 }, // 2分钟内增加到200用户
    { duration: '5m', target: 200 }, // 保持200用户5分钟
    { duration: '2m', target: 0 },   // 2分钟内减少到0用户
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99%的请求在1.5秒内完成
    http_req_failed: ['rate<0.1'],     // 错误率小于10%
  },
};

export default function () {
  let response = http.get('https://crm-staging.luolai.com/api/health');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

---

## 🔔 通知和监控

### 1. 通知配置

#### 1.1 钉钉通知
```yaml
# 钉钉通知配置
.notify_dingtalk: &notify_dingtalk
  image: alpine:latest
  before_script:
    - apk add --no-cache curl jq
  script:
    - |
      WEBHOOK_URL="https://oapi.dingtalk.com/robot/send?access_token=$DINGTALK_TOKEN"
      
      if [ "$CI_JOB_STATUS" = "success" ]; then
        COLOR="green"
        EMOJI="✅"
        STATUS="成功"
      else
        COLOR="red"
        EMOJI="❌"
        STATUS="失败"
      fi
      
      MESSAGE="{
        \"msgtype\": \"markdown\",
        \"markdown\": {
          \"title\": \"CI/CD流水线通知\",
          \"text\": \"## $EMOJI CI/CD流水线$STATUS\\n\\n**项目**: $CI_PROJECT_NAME\\n**分支**: $CI_COMMIT_REF_NAME\\n**阶段**: $CI_JOB_STAGE\\n**提交**: $CI_COMMIT_SHA\\n**提交者**: $CI_COMMIT_AUTHOR\\n**时间**: $(date)\\n\\n[查看详情]($CI_PIPELINE_URL)\"
        }
      }"
      
      curl -X POST -H "Content-Type: application/json" -d "$MESSAGE" $WEBHOOK_URL
  when: always

notify:success:
  <<: *notify_dingtalk
  stage: .post
  dependencies: []
  only:
    variables:
      - $CI_COMMIT_REF_NAME == "main"
      - $CI_COMMIT_REF_NAME == "develop"

notify:failure:
  <<: *notify_dingtalk
  stage: .post
  dependencies: []
  when: on_failure
  only:
    variables:
      - $CI_COMMIT_REF_NAME == "main"
      - $CI_COMMIT_REF_NAME == "develop"
```

#### 1.2 邮件通知
```yaml
# 邮件通知配置
notify:email:
  image: alpine:latest
  stage: .post
  before_script:
    - apk add --no-cache ssmtp
  script:
    - |
      cat > /etc/ssmtp/ssmtp.conf << EOF
      root=noreply@luolai.com
      mailhub=smtp.luolai.com:587
      AuthUser=$SMTP_USER
      AuthPass=$SMTP_PASSWORD
      UseSTARTTLS=YES
      EOF
      
      if [ "$CI_JOB_STATUS" = "success" ]; then
        SUBJECT="✅ CI/CD流水线执行成功 - $CI_PROJECT_NAME"
      else
        SUBJECT="❌ CI/CD流水线执行失败 - $CI_PROJECT_NAME"
      fi
      
      cat > email.txt << EOF
      To: devops@luolai.com
      Subject: $SUBJECT
      
      项目: $CI_PROJECT_NAME
      分支: $CI_COMMIT_REF_NAME
      提交: $CI_COMMIT_SHA
      提交者: $CI_COMMIT_AUTHOR
      流水线: $CI_PIPELINE_URL
      时间: $(date)
      EOF
      
      ssmtp devops@luolai.com < email.txt
  when: on_failure
  only:
    variables:
      - $CI_COMMIT_REF_NAME == "main"
```

### 2. 监控配置

#### 2.1 流水线监控
```yaml
# Prometheus监控配置
# prometheus/gitlab-ci-exporter.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitlab-ci-exporter
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: gitlab-ci-exporter
  template:
    metadata:
      labels:
        app: gitlab-ci-exporter
    spec:
      containers:
      - name: exporter
        image: mvisonneau/gitlab-ci-pipelines-exporter:latest
        env:
        - name: GCPE_GITLAB_TOKEN
          valueFrom:
            secretKeyRef:
              name: gitlab-token
              key: token
        - name: GCPE_CONFIG
          value: |
            gitlab:
              url: https://gitlab.luolai.com
            projects:
              - name: crm
                id: 123
            metrics:
              - kind: pipeline
                labels:
                  - project
                  - ref
                  - status
              - kind: job
                labels:
                  - project
                  - ref
                  - stage
                  - job_name
                  - status
        ports:
        - containerPort: 8080
```

#### 2.2 Grafana仪表板
```json
{
  "dashboard": {
    "title": "CI/CD流水线监控",
    "panels": [
      {
        "title": "流水线成功率",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(gitlab_ci_pipeline_status{status=\"success\"}[24h]) / rate(gitlab_ci_pipeline_status[24h]) * 100"
          }
        ]
      },
      {
        "title": "平均构建时间",
        "type": "stat",
        "targets": [
          {
            "expr": "avg(gitlab_ci_pipeline_duration_seconds)"
          }
        ]
      },
      {
        "title": "部署频率",
        "type": "graph",
        "targets": [
          {
            "expr": "increase(gitlab_ci_pipeline_status{status=\"success\",ref=\"main\"}[1d])"
          }
        ]
      }
    ]
  }
}
```

---

## 🛠️ 运维脚本和工具

### 1. 部署脚本

#### 1.1 快速部署脚本
```bash
#!/bin/bash
# scripts/quick-deploy.sh

set -e

ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}
NAMESPACE="crm-$ENVIRONMENT"

echo "🚀 开始快速部署到 $ENVIRONMENT 环境"

# 检查参数
if [ -z "$ENVIRONMENT" ]; then
    echo "❌ 请指定环境: staging, preprod, prod"
    exit 1
fi

# 检查kubectl连接
if ! kubectl cluster-info > /dev/null 2>&1; then
    echo "❌ 无法连接到Kubernetes集群"
    exit 1
fi

# 更新镜像
echo "📦 更新镜像标签..."
kubectl set image deployment/crm-backend backend=harbor.luolai.com/crm/backend:$IMAGE_TAG -n $NAMESPACE
kubectl set image deployment/crm-frontend frontend=harbor.luolai.com/crm/frontend:$IMAGE_TAG -n $NAMESPACE

# 等待部署完成
echo "⏳ 等待部署完成..."
kubectl rollout status deployment/crm-backend -n $NAMESPACE --timeout=600s
kubectl rollout status deployment/crm-frontend -n $NAMESPACE --timeout=600s

# 健康检查
echo "🏥 执行健康检查..."
./scripts/health-check.sh $ENVIRONMENT

echo "✅ 快速部署完成！"
```

#### 1.2 回滚脚本
```bash
#!/bin/bash
# scripts/rollback.sh

set -e

ENVIRONMENT=${1:-staging}
REVISION=${2:-1}
NAMESPACE="crm-$ENVIRONMENT"

echo "🔄 开始回滚 $ENVIRONMENT 环境到版本 $REVISION"

# 回滚部署
echo "📦 回滚后端服务..."
kubectl rollout undo deployment/crm-backend -n $NAMESPACE --to-revision=$REVISION

echo "📦 回滚前端服务..."
kubectl rollout undo deployment/crm-frontend -n $NAMESPACE --to-revision=$REVISION

# 等待回滚完成
echo "⏳ 等待回滚完成..."
kubectl rollout status deployment/crm-backend -n $NAMESPACE --timeout=600s
kubectl rollout status deployment/crm-frontend -n $NAMESPACE --timeout=600s

# 健康检查
echo "🏥 执行健康检查..."
./scripts/health-check.sh $ENVIRONMENT

echo "✅ 回滚完成！"
```

### 2. 监控脚本

#### 2.1 健康检查脚本
```bash
#!/bin/bash
# scripts/health-check.sh

ENVIRONMENT=${1:-staging}
VERSION=${2:-}

case $ENVIRONMENT in
    "dev")
        BASE_URL="https://crm-dev.luolai.com"
        ;;
    "staging")
        BASE_URL="https://crm-staging.luolai.com"
        ;;
    "preprod")
        BASE_URL="https://crm-preprod.luolai.com"
        ;;
    "prod")
        BASE_URL="https://crm.luolai.com"
        ;;
    *)
        echo "❌ 未知环境: $ENVIRONMENT"
        exit 1
        ;;
esac

echo "🏥 开始健康检查 - $ENVIRONMENT 环境"

# 检查前端
echo "🔍 检查前端服务..."
if curl -f -s "$BASE_URL" > /dev/null; then
    echo "✅ 前端服务正常"
else
    echo "❌ 前端服务异常"
    exit 1
fi

# 检查后端API
echo "🔍 检查后端API..."
if curl -f -s "$BASE_URL/api/health" > /dev/null; then
    echo "✅ 后端API正常"
else
    echo "❌ 后端API异常"
    exit 1
fi

# 检查数据库连接
echo "🔍 检查数据库连接..."
DB_STATUS=$(curl -s "$BASE_URL/api/health/db" | jq -r '.status')
if [ "$DB_STATUS" = "ok" ]; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接异常"
    exit 1
fi

# 检查Redis连接
echo "🔍 检查Redis连接..."
REDIS_STATUS=$(curl -s "$BASE_URL/api/health/redis" | jq -r '.status')
if [ "$REDIS_STATUS" = "ok" ]; then
    echo "✅ Redis连接正常"
else
    echo "❌ Redis连接异常"
    exit 1
fi

echo "✅ 所有健康检查通过！"
```

这个完整的CI/CD流水线设计方案提供了从代码提交到生产部署的全自动化流程，确保代码质量、安全性和部署可靠性。
