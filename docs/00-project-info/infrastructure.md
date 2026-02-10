# 基础设施概览 (Infrastructure Overview)

> **⚠️ 核心环境信息**
>
> - **区域 (Region)**: 华东2 (上海) `cn-shanghai`
> - **ECS 实例**: `launch-advisor-20260206`
>   - **公网 IP**: `106.15.43.218`
>   - **内网 IP**: `172.21.224.64`
> - **RDS 实例**: `pgm-uf6aq31y169c8wvl`
>   - **引擎**: PostgreSQL 17.0
>   - **连接地址**: `pgm-uf6aq31y169c8wvl.pg.rds.aliyuncs.com`

## 部署拓扑

```mermaid
graph TD
    User[用户] --> DNS[域名解析]
    DNS --> ECS[ECS 服务器 (上海)]
    subgraph ECS[ECS: launch-advisor-20260206]
        Nginx[Nginx Proxy]
        App[Next.js App]
        PgBouncer[PgBouncer 连接池]
    end

    ECS --> RDS[RDS PostgreSQL (上海)]

    Nginx --> App
    App --> PgBouncer
    PgBouncer --> RDS
```

## 自动化部署

- **当前机制**: GitHub Actions (`.github/workflows/deploy.yml`)
- **目标机制**: Codeup 云效流水线 (`flow.yaml`)
