# AI智能待办助理

一个基于AI的智能待办事项管理Web应用，支持自然语言输入、智能解析和多用户协作。

## 功能特色

- 📱 **移动端优先设计** - 专为手机使用优化的响应式界面
- 🔐 **手机号登录** - 简单安全的手机号验证登录系统
- 📅 **日历视图** - 直观的日历界面，按日期管理待办事项
- 🤖 **AI智能解析** - 使用自然语言描述，AI自动提取时间、优先级等信息
- 🔄 **多轮对话** - AI助手可以询问缺失信息，确保待办事项完整
- 👥 **多用户协作** - 支持任务共享和协作
- 🏷️ **智能标签** - 自动生成和管理场景标签
- ⚡ **实时同步** - 基于Cloudflare平台的高性能架构

## 技术架构

- **前端**: Vue.js 3 + Pinia + Tailwind CSS
- **后端**: Cloudflare Workers Functions
- **数据库**: Cloudflare D1 (SQLite)
- **缓存**: Cloudflare KV
- **AI服务**: OpenRouter + DeepSeek模型
- **部署**: Cloudflare Pages

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Cloudflare账号

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd ai-todo-assistant
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**

创建 `.dev.vars` 文件用于本地开发：
```env
OPENROUTER_API_KEY=your-openrouter-api-key-here
JWT_SECRET=your-jwt-secret-here
```

> ⚠️ **重要**: 请从 [OpenRouter](https://openrouter.ai/) 获取你自己的API密钥，不要使用任何示例密钥

4. **创建Cloudflare资源**

```bash
# 创建D1数据库
npm run d1:create

# 创建KV命名空间
npm run kv:create
```

5. **运行数据库迁移**
```bash
npm run d1:migrate
```

6. **启动开发服务器**
```bash
npm run dev
```

访问 `http://localhost:3000` 开始使用。

### 部署到生产环境

1. **配置wrangler.toml**

更新 `wrangler.toml` 中的数据库ID和KV命名空间ID：

```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "todos_db"
database_id = "your-actual-d1-database-id"

[[env.production.kv_namespaces]]
binding = "AUTH_KV"
id = "your-actual-kv-namespace-id"
```

2. **设置密钥**
```bash
wrangler secret put OPENROUTER_API_KEY
```

3. **运行生产环境数据库迁移**
```bash
npm run d1:migrate:prod
```

4. **构建和部署**
```bash
npm run build
npm run deploy
```

## 项目结构

```
aitodo/
├── functions/              # Cloudflare Workers函数
│   ├── api/
│   │   ├── auth.js        # 用户认证API
│   │   ├── todos.js       # 待办事项CRUD API
│   │   └── ai-parser.js   # AI解析API
│   └── utils/
│       └── auth.js        # 认证工具函数
├── src/                   # 前端Vue.js应用
│   ├── components/        # Vue组件
│   ├── pages/            # 页面组件
│   │   ├── LoginPage.vue
│   │   ├── CalendarPage.vue
│   │   └── AddTodoPage.vue
│   ├── stores/           # Pinia状态管理
│   │   ├── auth.js
│   │   └── todos.js
│   └── utils/
│       └── api.js        # API客户端
├── database/             # 数据库相关
│   ├── schema.sql
│   └── migrations/
└── dist/                 # 构建输出目录
```

## API接口

### 认证接口

- `POST /api/auth` - 发送验证码/验证登录

### 待办事项接口

- `GET /api/todos` - 获取待办事项列表
- `POST /api/todos` - 创建新的待办事项
- `PUT /api/todos/:id` - 更新待办事项
- `DELETE /api/todos/:id` - 删除待办事项

### AI解析接口

- `POST /api/ai-parser` - AI解析自然语言输入

## 使用说明

### 登录

1. 输入手机号码
2. 点击"发送验证码"
3. 输入收到的验证码（开发环境会显示调试验证码）
4. 点击"登录"

### 查看待办事项

1. 登录后自动进入日历页面
2. 点击日历上的日期查看当天的待办事项
3. 待办事项按紧急程度排序显示

### 添加待办事项

1. 点击右下角的"+"按钮
2. 在文本框中用自然语言描述待办事项
3. 点击"AI解析"让AI提取信息
4. 如有需要，回答AI的补充问题
5. 确认并调整提取的信息
6. 点击"创建待办事项"

### AI解析示例

输入：
```
明天下午3点和张总开会讨论项目进度，这个很重要，提醒我提前准备会议材料
```

AI会自动提取：
- 标题：和张总开会讨论项目进度
- 日期：明天的日期
- 时间：15:00
- 优先级：紧急
- 描述：提前准备会议材料
- 提醒：启用

## 开发指南

### 添加新的API端点

1. 在 `functions/api/` 目录下创建新文件
2. 导出 `onRequestGet`、`onRequestPost` 等函数
3. 使用 `requireAuth` 进行身份验证

### 修改AI提示词

编辑 `functions/api/ai-parser.js` 中的 `SYSTEM_PROMPT` 常量。

### 添加新的数据库表

1. 在 `database/migrations/` 目录下创建新的迁移文件
2. 运行 `npm run d1:migrate` 应用迁移

## 故障排除

### 常见问题

1. **AI解析失败**
   - 检查OpenRouter API密钥是否正确设置
   - 确认网络连接正常

2. **数据库连接错误**
   - 确认D1数据库ID配置正确
   - 检查数据库迁移是否成功运行

3. **登录失败**
   - 检查KV命名空间配置
   - 确认手机号格式正确

### 日志查看

```bash
# 查看Cloudflare Workers日志
wrangler tail

# 查看本地开发日志
npm run dev
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请创建Issue或联系开发团队。 