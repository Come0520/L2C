# 移动端数据同步 API

> 移动端离线数据同步、照片上传队列

## 目录

- [同步机制概述](#同步机制概述)
- [离线数据同步](#离线数据同步)
- [照片上传队列](#照片上传队列)
- [冲突解决](#冲突解决)

---

## 同步机制概述

### 同步策略

移动端采用 **增量同步 + 冲突检测** 策略：

1. **增量同步**：只同步修改过的数据
2. **版本控制**：使用 `updatedAt` 时间戳判断数据版本
3. **冲突解决**：服务端数据优先，客户端修改需重新合并

### 同步时机

| 事件 | 触发同步 |
|------|----------|
| App 启动 | 全量同步 |
| 网络恢复 | 增量同步 |
| 手动刷新 | 增量同步 |
| 后台定时 | 每 5 分钟 |

---

## 离线数据同步

### 获取待同步数据

```http
GET /api/mobile/sync/pending
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| lastSyncAt | string | 否 | 上次同步时间 (ISO 8601) |
| modules | string | 否 | 同步模块，逗号分隔 |

**响应示例**

```json
{
  "success": true,
  "data": {
    "syncAt": "2026-01-20T10:00:00Z",
    "tasks": [
      {
        "id": "uuid",
        "type": "MEASURE",
        "status": "PENDING_VISIT",
        "updatedAt": "2026-01-20T09:30:00Z"
      }
    ],
    "products": [],
    "customers": []
  }
}
```

### 上传离线数据

```http
POST /api/mobile/sync/upload
```

**请求体**

```json
{
  "deviceId": "device-uuid",
  "uploadedAt": "2026-01-20T10:15:00Z",
  "tasks": [
    {
      "id": "task-uuid",
      "action": "UPDATE",
      "data": {
        "status": "COMPLETED",
        "completedAt": "2026-01-20T10:00:00Z"
      },
      "localUpdatedAt": "2026-01-20T10:00:00Z"
    }
  ],
  "signatures": [
    {
      "taskId": "task-uuid",
      "signatureData": "base64...",
      "signedAt": "2026-01-20T10:05:00Z"
    }
  ]
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "syncedCount": 2,
    "conflicts": [],
    "failed": []
  }
}
```

---

## 照片上传队列

### 批量上传照片

```http
POST /api/mobile/photos/batch-upload
```

**请求体** (multipart/form-data)

| 字段 | 类型 | 说明 |
|------|------|------|
| photos | File[] | 照片文件数组 |
| metadata | JSON | 照片元数据 |

**元数据结构**

```json
{
  "photos": [
    {
      "localId": "local-uuid",
      "taskId": "task-uuid",
      "type": "BEFORE",
      "capturedAt": "2026-01-20T09:30:00Z",
      "location": {
        "lat": 30.123,
        "lng": 120.456
      }
    }
  ]
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "uploaded": [
      {
        "localId": "local-uuid",
        "remoteUrl": "https://cdn.example.com/photos/xxx.jpg"
      }
    ],
    "failed": []
  }
}
```

### 检查上传状态

```http
GET /api/mobile/photos/upload-status
```

**Query 参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| localIds | string | 本地 ID 列表，逗号分隔 |

---

## 冲突解决

### 冲突类型

| 冲突类型 | 说明 | 解决策略 |
|----------|------|----------|
| VERSION_CONFLICT | 版本冲突 | 服务端优先 |
| STATUS_CONFLICT | 状态不可回退 | 拒绝客户端修改 |
| DELETE_CONFLICT | 数据已删除 | 返回删除标记 |

### 获取冲突详情

```http
GET /api/mobile/sync/conflicts
```

**响应**

```json
{
  "success": true,
  "data": {
    "conflicts": [
      {
        "entityType": "TASK",
        "entityId": "uuid",
        "conflictType": "VERSION_CONFLICT",
        "serverVersion": { ... },
        "clientVersion": { ... },
        "resolvedAt": null
      }
    ]
  }
}
```

### 解决冲突

```http
POST /api/mobile/sync/conflicts/{id}/resolve
```

**请求体**

```json
{
  "resolution": "ACCEPT_SERVER"
}
```

---

## 同步状态

### 获取同步状态

```http
GET /api/mobile/sync/status
```

**响应**

```json
{
  "success": true,
  "data": {
    "lastSyncAt": "2026-01-20T10:00:00Z",
    "pendingUploadCount": 3,
    "pendingPhotoCount": 5,
    "conflictCount": 0,
    "networkStatus": "ONLINE"
  }
}
```
