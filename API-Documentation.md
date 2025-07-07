# AI 智能待办助理 - Web API 接口文档

## 概述

AI 智能待办助理是一个基于 Cloudflare Workers 和 Pages 的 Web 应用，提供智能待办事项管理功能。本文档详细描述了所有后端 API 接口的使用方法。

### 基础信息

- **技术栈**: Cloudflare Workers、Pages、D1 数据库、KV 存储、R2 对象存储
- **认证方式**: Bearer Token
- **数据格式**: JSON
- **AI 模型**: OpenRouter（文本和图片：gemini-2.5-flash-preview）

### 基础 URL

```
Production: https://main.ai-todo-assistant.pages.dev/api
Development: http://localhost:8788/api
```

### 通用响应格式

#### 成功响应
```json
{
  "success": true,
  "data": { /* 业务数据 */ },
  "message": "操作成功"
}
```

#### 错误响应
```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

### 通用状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/登录过期 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 认证接口

### 1. 用户登录

**接口**: `POST /api/auth`

**描述**: 用户通过手机号登录系统

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "phone": "13800138000",
  "action": "login"
}
```

**响应**:
```json
{
  "success": true,
  "message": "验证码已发送",
  "debug_code": "123456"
}
```

### 2. 验证码验证

**接口**: `POST /api/auth`

**描述**: 验证短信验证码并完成登录

**请求体**:
```json
{
  "phone": "13800138000",
  "action": "verify"
}
```

**响应**:
```json
{
  "success": true,
  "token": "auth_token_string",
  "user": {
    "id": 1,
    "phone": "13800138000"
  }
}
```

---

## 待办事项接口

### 1. 获取待办事项列表

**接口**: `GET /api/todos`

**描述**: 获取用户的待办事项列表

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| date | string | 否 | 日期过滤（YYYY-MM-DD） |
| page | number | 否 | 页码（默认：1） |
| limit | number | 否 | 每页数量（默认：20） |

**响应**:
```json
{
  "success": true,
  "todos": [
    {
      "id": 1,
      "creator_id": 1,
      "title": "开会讨论项目",
      "description": "与产品团队讨论新功能",
      "due_date": "2024-12-20",
      "due_time": "14:00",
      "priority": "紧急",
      "tags": ["工作", "会议"],
      "involved_users": [2, 3],
      "reminder_enabled": true,
      "reminder_method": "系统通知",
      "completed": false,
      "created_at": "2024-12-19T10:00:00.000Z",
      "updated_at": "2024-12-19T10:00:00.000Z",
      "creator_phone": "13800138000",
      "shared_permission": null,
      "user_relation": "owner",
      "priority_order": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 2. 创建待办事项

**接口**: `POST /api/todos`

**描述**: 创建新的待办事项

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "title": "开会讨论项目",
  "description": "与产品团队讨论新功能",
  "due_date": "2024-12-20",
  "due_time": "14:00",
  "priority": "紧急",
  "tags": ["工作", "会议"],
  "involved_users": [2, 3],
  "reminder_enabled": true,
  "reminder_method": "系统通知"
}
```

**字段说明**:
- `title`: 待办事项标题（必需）
- `description`: 详细描述（可选）
- `due_date`: 截止日期（YYYY-MM-DD）
- `due_time`: 截止时间（HH:MM）
- `priority`: 紧急程度（"一般"、"紧急"、"非常紧急"）
- `tags`: 标签数组
- `involved_users`: 涉及人员ID数组
- `reminder_enabled`: 是否启用提醒
- `reminder_method`: 提醒方式

**响应**:
```json
{
  "success": true,
  "todo": {
    "id": 1,
    "creator_id": 1,
    "title": "开会讨论项目",
    "description": "与产品团队讨论新功能",
    "due_date": "2024-12-20",
    "due_time": "14:00",
    "priority": "紧急",
    "tags": ["工作", "会议"],
    "involved_users": [2, 3],
    "reminder_enabled": true,
    "reminder_method": "系统通知",
    "completed": false,
    "created_at": "2024-12-19T10:00:00.000Z",
    "updated_at": "2024-12-19T10:00:00.000Z"
  }
}
```

### 3. 更新待办事项

**接口**: `PUT /api/todos/{id}`

**描述**: 更新指定的待办事项

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "title": "更新后的标题",
  "completed": true,
  "priority": "一般"
}
```

**响应**:
```json
{
  "success": true,
  "todo": {
    /* 更新后的待办事项完整信息 */
  }
}
```

### 4. 删除待办事项

**接口**: `DELETE /api/todos/{id}`

**描述**: 删除指定的待办事项（仅创建者可删除）

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "message": "删除成功"
}
```

---

## AI 解析接口

### 1. 文本解析

**接口**: `POST /api/ai-parser`

**描述**: 使用AI解析用户输入的文本，提取待办事项信息

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "text": "明天下午3点和张三开会讨论项目，很紧急",
  "conversation_id": "conv_123" // 可选，用于多轮对话
}
```

**响应**:
```json
{
  "success": true,
  "parsed_todos": [
    {
      "title": "和张三开会讨论项目",
      "description": "项目讨论会议",
      "due_date": "2024-12-20",
      "due_time": "15:00",
      "priority": "紧急",
      "tags": ["工作", "会议"],
      "involved_users": ["张三"],
      "reminder_enabled": true,
      "reminder_method": "系统通知"
    }
  ],
  "conversation_id": "conv_123",
  "needs_clarification": false,
  "clarification_questions": []
}
```

### 2. 图片解析

**接口**: `POST /api/image-parser`

**描述**: 使用AI解析上传的图片，提取待办事项信息

**请求头**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求体**:
```
image: <image_file>
conversation_id: conv_123 (可选)
```

**支持的图片格式**: JPG、PNG、WebP、HEIC、HEIF

**响应**:
```json
{
  "success": true,
  "parsed_todos": [
    {
      "title": "医院复诊",
      "description": "内科复诊检查",
      "due_date": "2024-12-25",
      "due_time": "09:00",
      "priority": "紧急",
      "tags": ["健康", "医院"],
      "involved_users": [],
      "reminder_enabled": true,
      "reminder_method": "系统通知"
    }
  ],
  "image_url": "https://r2.example.com/image_id.jpg",
  "conversation_id": "conv_123"
}
```

---

## 用户管理接口

### 1. 搜索用户

**接口**: `GET /api/users`

**描述**: 根据手机号搜索用户（用于分享功能）

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| q | string | 是 | 搜索关键词（手机号，至少3个字符） |

**响应**:
```json
{
  "success": true,
  "users": [
    {
      "id": 2,
      "phone": "13800138001",
      "name": "张三"
    }
  ]
}
```

---

## 分享接口

### 1. 分享待办事项

**接口**: `POST /api/share`

**描述**: 将待办事项分享给其他用户

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "todo_id": 1,
  "user_id": 2,
  "permission": "read"
}
```

**权限类型**:
- `read`: 只读权限
- `write`: 读写权限

**响应**:
```json
{
  "success": true,
  "message": "分享成功"
}
```

---

## 节假日接口

### 1. 获取节假日数据

**接口**: `GET /api/holidays`

**描述**: 获取指定年份或月份的节假日数据

**查询参数**:
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| year | string | 二选一 | 年份（如：2024） |
| month | string | 二选一 | 年月（如：202412） |

**响应**:
```json
{
  "year": 2024,
  "holidays": {
    "2024-01-01": {
      "name": "元旦",
      "isOffDay": true
    },
    "2024-02-08": {
      "name": "春节调休",
      "isOffDay": false
    },
    "2024-02-10": {
      "name": "春节",
      "isOffDay": true
    }
  },
  "source": "github",
  "updated": "2024-12-19T10:00:00.000Z"
}
```

**节假日数据说明**:
- `name`: 节假日名称
- `isOffDay`: 是否为休息日（true: 休息，false: 工作）

**数据源优先级**:
1. KV 缓存（7天TTL）
2. GitHub holiday-cn 数据源
3. 内置 fallback 数据

---

## 测试接口

### 1. 测试 OpenRouter 连接

**接口**: `GET /api/test-openrouter`

**描述**: 测试与OpenRouter AI服务的连接状态

**响应**:
```json
{
  "success": true,
  "status": 200,
  "model": "google/gemini-2.5-flash-preview-05-20",
  "response": {
    "choices": [
      {
        "message": {
          "content": "OK"
        }
      }
    ]
  }
}
```

---

## 错误代码

| 错误码 | 说明 |
|--------|------|
| AUTH_REQUIRED | 需要认证 |
| AUTH_EXPIRED | 认证过期 |
| INVALID_PHONE | 手机号格式错误 |
| USER_NOT_FOUND | 用户不存在 |
| TODO_NOT_FOUND | 待办事项不存在 |
| PERMISSION_DENIED | 权限不足 |
| INVALID_PRIORITY | 无效的紧急程度 |
| INVALID_IMAGE | 无效的图片格式 |
| AI_SERVICE_ERROR | AI服务错误 |
| DATABASE_ERROR | 数据库错误 |

---

## 数据模型

### 用户 (User)
```json
{
  "id": 1,
  "phone": "13800138000",
  "name": "张三",
  "created_at": "2024-12-19T10:00:00.000Z",
  "updated_at": "2024-12-19T10:00:00.000Z"
}
```

### 待办事项 (Todo)
```json
{
  "id": 1,
  "creator_id": 1,
  "title": "开会讨论项目",
  "description": "与产品团队讨论新功能",
  "due_date": "2024-12-20",
  "due_time": "14:00",
  "priority": "紧急",
  "tags": ["工作", "会议"],
  "involved_users": [2, 3],
  "reminder_enabled": true,
  "reminder_method": "系统通知",
  "completed": false,
  "created_at": "2024-12-19T10:00:00.000Z",
  "updated_at": "2024-12-19T10:00:00.000Z"
}
```

### 分享记录 (TodoShare)
```json
{
  "id": 1,
  "todo_id": 1,
  "user_id": 2,
  "permission": "read",
  "created_at": "2024-12-19T10:00:00.000Z"
}
```

---

## 使用示例

### JavaScript 前端调用示例

```javascript
// 设置认证令牌
const token = localStorage.getItem('auth_token');

// 获取待办事项列表
async function getTodos(date) {
  const response = await fetch(`/api/todos?date=${date}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

// 创建待办事项
async function createTodo(todoData) {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(todoData)
  });
  return response.json();
}

// AI 文本解析
async function parseText(text) {
  const response = await fetch('/api/ai-parser', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });
  return response.json();
}

// 图片上传解析
async function parseImage(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await fetch('/api/image-parser', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
}
```

---

## 环境变量配置

### 必需的环境变量

```env
# OpenRouter AI 配置
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
TEXT_MODEL_NAME=google/gemini-2.5-flash-preview-05-20
MULTI_MODEL_NAME=google/gemini-2.5-flash-preview-05-20

# Cloudflare 服务绑定
# DB: D1 数据库绑定
# AUTH_KV: 认证KV存储绑定
# AI_TODO_KV: 通用KV存储绑定
# IMAGE_STORAGE: R2对象存储绑定
```

---

## 更新日志

### v0.1-202506 (2024-12-19)
- 初始版本发布
- 实现基础的用户认证功能
- 实现待办事项CRUD操作
- 集成AI文本解析功能
- 集成AI图片解析功能
- 添加节假日数据API
- 实现待办事项分享功能
- 完善用户搜索功能

---

## 技术支持

如需技术支持或报告问题，请联系开发团队或在项目仓库中提交 Issue。 