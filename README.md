# Your Rank — 你的排行，你说了算

一个以 Tier List 为核心形态的排行榜系统。五个品质等级横向铺开，条目以卡片形式分布在对应的行中，支持拖拽入列。

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 18 + TypeScript + Tailwind CSS + @dnd-kit |
| 后端 | Go 1.22 + chi + GORM + JWT |
| 数据库 | PostgreSQL 16 |
| 部署 | Docker Compose |

## 快速开始

### 1. 启动所有服务

```bash
docker compose up -d
```

### 2. 本地开发

**数据库：**
```bash
docker compose up -d postgres
```

**后端：**
```bash
cd backend
cp .env.example .env
go mod tidy
go run ./cmd/server
# API 运行在 :8080
```

**前端：**
```bash
cd frontend
npm install
npm run dev
# 开发服务器运行在 :3000，自动代理 API 到 :8080
```

## 项目结构

```
your-rank/
├── docker-compose.yml          # 一键启动全部服务
├── frontend/                   # React 18 + Tailwind CSS
│   ├── src/
│   │   ├── pages/              # 页面组件
│   │   ├── components/         # 通用组件
│   │   ├── hooks/              # 自定义 hooks
│   │   ├── services/           # API 调用
│   │   ├── types/              # TypeScript 类型
│   │   └── utils/              # 常量 & 工具
│   └── ...
├── backend/                    # Go API 服务
│   ├── cmd/server/             # 入口
│   ├── internal/
│   │   ├── config/             # 配置
│   │   ├── database/           # 数据库连接
│   │   ├── handler/            # HTTP 处理器
│   │   ├── middleware/          # 中间件 (auth/cors/限流)
│   │   ├── model/              # 数据模型
│   │   ├── repository/         # 数据访问层
│   │   ├── service/            # 业务逻辑层
│   │   └── router/             # 路由注册
│   └── pkg/                    # 公共工具
└── database/
    └── migrations/             # SQL 迁移文件
```

## API 路由

### 公开接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册（含验证码） |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/send-verify-code` | 发送邮箱验证码 |
| GET | `/api/v1/rankings/public` | 公开排行榜列表 |
| GET | `/api/v1/share/:code` | 通过分享码获取排行 |

### 需认证接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/rankings` | 创建排行榜 |
| GET | `/api/v1/rankings/mine` | 我的排行榜 |
| GET | `/api/v1/rankings/:id` | 排行榜详情 |
| PUT | `/api/v1/rankings/:id` | 更新排行榜（含封面） |
| DELETE | `/api/v1/rankings/:id` | 删除排行榜 |
| POST | `/api/v1/entries` | 创建条目 |
| PUT | `/api/v1/entries/:id` | 更新条目 |
| DELETE | `/api/v1/entries/:id` | 删除条目 |
| PUT | `/api/v1/entries/reorder` | 批量排序（拖拽保存） |
| POST | `/api/v1/upload` | 上传图片（自动缩略图） |
| POST | `/api/v1/upload/batch` | 批量上传（最多9张） |
| PUT | `/api/v1/profile` | 更新个人资料 |
| PUT | `/api/v1/profile/password` | 修改密码 |
| DELETE | `/api/v1/profile` | 注销账号 |
