# Your Rank 全栈应用 — 技术设计

## 设计版本

| 日期         | 版本 | 说明     |
| ------------ | ---- | -------- |
| 2026-06-30 | v1   | 初始设计 — 基于已有 Go 后端 API 契约，重写 React 前端 |

## 项目架构

- 架构类型: Monorepo（前后端分离）
- 前端框架: React 18 + TypeScript 5 + Vite 5
- 后端框架: Go 1.22 + chi v5 + GORM
- 数据库: PostgreSQL 16
- 部署: Docker Compose (3 容器: frontend/backend/postgres)

```
用户浏览器 (:3000 dev / :3000 prod)
    │
    ├── 静态文件 (React SPA) ── nginx:alpine
    │       │
    │       └── /api/* 代理到 backend:8080
    │
    └── Go API Server (:8080)
            │
            └── PostgreSQL 16 (:5432)
```

## 前端设计

### 设计稿

| 类型 | 链接/路径 | 说明 |
| ---- | --------- | ---- |
| Stitch 设计系统 | `docs/stitch_apple_style_ui_design/luminous_precision/DESIGN.md` | "Luminous Precision" 视觉系统：色彩、排版、圆角、阴影、玻璃态等定义 |
| Stitch 页面原型 1 | `docs/stitch_apple_style_ui_design/your_rank_1/code.html` + `screen.png` | 主编辑页面原型 |
| Stitch 页面原型 2 | `docs/stitch_apple_style_ui_design/your_rank_2/code.html` + `screen.png` | 变体页面原型 |
| Stitch 100vh 布局 | `docs/stitch_apple_style_ui_design/100vh_your_rank/code.html` + `screen.png` | 100vh 无滚动布局原型 |
| 功能设计文档 | `docs/夯拉排行榜设计文档.md` v5.1 | 完整功能规格、交互流程、页面路由 |

### 技术栈

| 类别 | 技术 | 用途 |
|------|------|------|
| 框架 | React 18 + TypeScript 5 | SPA 应用，strict 模式 |
| 构建 | Vite 5 | 开发服务器(:3000) + 生产构建 |
| 样式 | Tailwind CSS 3 + PostCSS | 原子化 CSS，自定义 Tier 色彩/品牌色/动画 |
| UI 组件 | Radix UI（Avatar/Dialog/DropdownMenu/Label/Separator/Slot/Tabs/Tooltip） | 无头原始组件 |
| 工具 | tailwind-merge + tailwindcss-animate | CSS 类名智能合并，动画预设 |
| 拖拽 | @dnd-kit/core + @dnd-kit/sortable | 条目卡片跨行拖拽与行内排序 |
| 路由 | react-router-dom v6 | createBrowserRouter 数据路由 |
| HTTP | axios | 请求/响应拦截器，JWT 注入，401 自动跳转 |
| 通知 | react-hot-toast | 操作反馈轻提示 |
| 海报 | qrcode + html2canvas | 分享二维码 + 海报截图合成 |
| Mock | MSW (Mock Service Worker) | API Mock 策略，与后端解耦开发 |

### 路由设计

| 路径 | 页面组件 | 说明 | 鉴权 |
| ---- | -------- | ---- | ---- |
| `/login` | `LoginPage` | 登录页 | 否 |
| `/register` | `RegisterPage` | 注册页 | 否 |
| `/home` | `DiscoverPage` | 发现页（公开排行列表） | 否 |
| `/my-rankings` | `MyRankingsPage` | 我的排行榜管理 | 是 |
| `/create` | `CreateRankingPage` | 创建新排行榜 | 是 |
| `/ranking/:id` | `RankingDetailPage` | 排行详情（只读） | 视可见性 |
| `/ranking/:id/manage` | `RankingManagePage` | 排行管理（拖拽入列） | 是(创建者) |
| `/s/:code` | `SharePage` | 分享页 | 否 |
| `/profile` | `ProfilePage` | 个人中心 | 是 |

### 组件树

```
App
├── AuthLayout（登录/注册页布局）
│   ├── LoginPage
│   │   └── LoginForm（邮箱/用户名 + 密码 + 记住我）
│   └── RegisterPage
│       └── RegisterForm（用户名 + 邮箱 + 密码 + 验证码）
│
├── MainLayout（主应用布局 — 顶部导航 + 内容区）
│   ├── Navbar（Logo + 导航链接 + 用户头像下拉菜单）
│   ├── DiscoverPage
│   │   ├── SearchBar（关键词搜索）
│   │   ├── CategoryFilter（分类标签筛选）
│   │   └── RankingCardGrid（排行卡片网格 + 无限滚动）
│   │       └── RankingCard（封面缩略图 + 标题 + 条目数 + 等级分布）
│   ├── MyRankingsPage
│   │   ├── FilterSortBar（分类筛选 + 排序切换）
│   │   └── RankingCardGrid
│   ├── CreateRankingPage
│   │   └── RankingForm（标题 + 描述 + 封面图上传 + 分类 + 可见范围）
│   └── ProfilePage
│       ├── AvatarEditor（头像上传 + 裁剪）
│       ├── ProfileForm（昵称 + 简介编辑）
│       ├── PasswordForm（旧密码 + 新密码）
│       └── DeleteAccountButton（注销账号 + 二次确认）
│
├── RankingDetailPage（只读排行详情）
│   ├── RankingHeader（标题 + 描述 + 创建者）
│   └── TierRowReadonly × 5（只读等级行 + 条目卡片展示）
│       └── EntryCard（配图 + 名称 + 等级徽章）
│
├── RankingManagePage（核心页面 — 100vh 无滚动）
│   ├── TopBar（← 返回 + 面包屑 + 分享按钮 + 更多菜单）
│   ├── RankingInfoBar（标题编辑 + 分类 + 可见范围 — 可折叠）
│   ├── AddEntryButton（快捷添加入口）
│   ├── DragDropCore（拖拽入列核心区 — flex: 1 占满剩余高度）
│   │   ├── TierRow × 5（等级行 — 各 ~14% 高度，min 120px）
│   │   │   ├── TierBadge（等级徽章 + 行标题）
│   │   │   └── EntryCardList（横向滚动容器 + @dnd-kit sortable）
│   │   │       └── DraggableEntryCard（条目卡片 + 编辑/删除按钮）
│   │   └── PendingZone（待放置区 — ~16% 高度，min 120px）
│   │       └── EntryCardList（同上，新条目默认进入此区）
│   └── StatusBar（底部状态栏 — 保存状态/未保存提示）
│
├── SharePage
│   ├── ShareHeader（排行标题 + 描述 + 创建者信息）
│   └── TierRowReadonly × 5
│       └── EntryCardReadonly（纯展示条目卡片）
│   └── ShareFooter（"由 Your Rank 生成" + 创建引导 CTA）
│
└── Shared Components（全局共享组件）
    ├── ImageUploader（点击/拖拽/粘贴上传，压缩预览，裁剪弹窗）
    ├── ConfirmDialog（二次确认弹窗 — 用于删除、注销等敏感操作）
    ├── SharePosterModal（分享海报生成 + 复制链接）
    └── EmptyState（空状态占位提示）
```

### 状态管理

- **认证状态**: `localStorage` 存储 JWT token + 自定义 `auth-change` 事件驱动全局状态同步。`AuthContext` 提供 `user` / `isAuthenticated` / `login()` / `logout()`。
- **拖拽状态**: `@dnd-kit` 内部管理拖拽中的视觉状态（抓起/悬停/释放），业务状态通过 800ms 防抖后调用 `PUT /api/v1/entries/reorder` 持久化。
- **API 缓存**: axios + 组件内 `useState`/`useEffect` 管理请求状态。不引入 React Query/SWR — 保持轻量，MVP 阶段不引入额外依赖。
- **表单状态**: 各表单组件内部管理，提交时调用对应 API。
- **未保存保护**: `beforeunload` 事件 + react-router `useBlocker`，拖拽变更后标记 `isDirty`。

### Mock 策略

后端已基本实现，前端开发使用 Vite proxy 直连后端 API。对缺失的 `send-verify-code` 接口，使用 MSW 临时 mock。

```
Vite dev server (:3000)
  ├── /api/* → proxy to http://localhost:8080/api/v1/*
  └── 其他 → React SPA
```

MSW handler 列表（仅用于后端未就绪的接口）:

| Method | Path | Mock 行为 |
| ------ | ---- | --------- |
| POST | `/api/v1/auth/send-verify-code` | 返回 `{ message: "验证码已发送", expires_in: 600 }` |

### 视觉设计要点

基于 Stitch "Luminous Precision" 设计系统：

- **色彩**: 中性高调底色（`#F9F9F9` / `#F5F5F7` Apple Gray），Tier 等级用高饱和度语义色（S: 金色渐变, A: 赤红, B: 电光紫, C: 石墨灰, D: 浅灰）
- **玻璃态**: 顶栏使用 `backdrop-blur(20px)` + `bg-white/72`，拖拽抓起卡片使用 `0 4px 24px rgba(0,0,0,0.04)` + `scale(1.05)`
- **圆角**: 容器卡片 `rounded-xl` (24px)，按钮/输入框 `rounded-lg` (16px)，图片缩略图裁剪跟随容器圆角
- **排版**: Inter 字体系列，标题用 Semi-bold/Bold + 负字间距(-1%~-2%)，正文用 Regular，标签用 +2% 字间距
- **布局硬约束**: 拖拽管理页 100vh，顶部/信息/状态栏固定高度，拖拽核心区 flex: 1 占满，六个行区域按百分比(~14%/14%/14%/14%/14%/16%) 均分剩余高度，行内溢出走横向滚动

## 后端设计

### API 路由

路由前缀: `/api/v1`

#### 公开接口

| Method | Path | Handler | 说明 |
| ------ | ---- | ------- | ---- |
| POST | `/auth/register` | `auth.Register` | 用户注册，返回 JWT + 用户信息 |
| POST | `/auth/login` | `auth.Login` | 用户登录（邮箱/用户名 + 密码） |
| POST | `/auth/send-verify-code` | `auth.SendVerifyCode` | **[待实现]** 发送邮箱验证码 |
| GET | `/rankings/public` | `ranking.ListPublic` | 公开排行榜列表（分页+筛选+搜索） |
| GET | `/share/{code}` | `ranking.GetByShareCode` | 通过 8 位分享码获取排行详情 |

#### 需认证接口

| Method | Path | Handler | 说明 |
| ------ | ---- | ------- | ---- |
| POST | `/rankings` | `ranking.Create` | 创建排行榜 |
| GET | `/rankings/mine` | `ranking.ListMy` | 我的排行榜列表 |
| GET | `/rankings/{id}` | `ranking.Get` | 排行榜详情（含条目） |
| PUT | `/rankings/{id}` | `ranking.Update` | 更新排行榜信息 |
| DELETE | `/rankings/{id}` | `ranking.Delete` | 删除排行榜（级联删除条目） |
| POST | `/entries` | `entry.Create` | 创建条目（默认进入待放置区） |
| PUT | `/entries/{id}` | `entry.Update` | 更新条目信息 |
| DELETE | `/entries/{id}` | `entry.Delete` | 删除条目 |
| PUT | `/entries/reorder` | `entry.Reorder` | 批量排序（拖拽保存） |
| POST | `/upload` | `upload.UploadImage` | 上传单张图片（自动缩略图） |
| POST | `/upload/batch` | `upload.BatchUpload` | 批量上传（最多 9 张） |
| PUT | `/profile` | `profile.UpdateProfile` | 更新个人资料 |
| PUT | `/profile/password` | `profile.UpdatePassword` | 修改密码 |
| DELETE | `/profile` | `profile.DeleteAccount` | 注销账号 |

### 业务逻辑

| Service | 职责 |
| ------- | ---- |
| `AuthService` | 注册（密码 bcrypt 哈希 + JWT 签发）、登录（账号查找 + 密码校验 + 记住我双有效期）、验证码生成与校验 |
| `RankingService` | 排行榜创建（生成 8 位分享码）、更新（权限校验）、删除（级联清理图片+条目）、查询（含关联条目）、分享码查找 |
| `EntryService` | 条目 CRUD（权限校验）、批量重排序（拖拽保存，事务包裹） |
| `UploadService` | 图片保存（MIME 真实校验）、缩略图生成（200px/800px）、路径穿越防护 |
| `ProfileService` | 资料更新、密码修改（旧密码验证）、账号注销（级联清理或保留数据） |

### 数据模型

| 表 | 关键字段 | 索引 |
|------|------|------|
| `users` | id(UUID), username(unique), email(unique), password(bcrypt), nickname, avatar_url, bio, email_verified, verify_code, verify_code_expire, verify_code_attempts, login_fail_count, locked_until, last_login_at, last_login_ip, deleted_at | username(unique), email(unique), deleted_at |
| `rankings` | id(UUID), user_id(FK), title, description, cover_url, category, visibility, share_code(unique, 8位), view_count, deleted_at | user_id, share_code(unique), deleted_at |
| `entries` | id(UUID), ranking_id(FK), name, description, image_url, link_url, tier(S/A/B/C/D or null), sort_order, deleted_at | ranking_id, deleted_at |
| `images` | id(UUID), user_id(FK), origin_url, thumb_s_url, thumb_m_url, file_size, mime_type, width, height | user_id |
| `device_registrations` | id(UUID), user_id(FK), device_id, created_at | — |

## API 契约

详见 `api-contract.yaml`，该文件是前后端联调的唯一真相源。

## 安全考虑

| 层面 | 措施 |
|------|------|
| 传输层 | JWT Bearer Token（HS256），2h / 7d 双有效期。前端 axios 拦截器自动注入 Authorization 头，401 自动跳转登录页 |
| 存储层 | bcrypt 密码哈希，敏感字段 `json:"-"` 不返回客户端（password, verify_code, login_fail_count 等） |
| 输入层 | SanitizeString（去空格+截断）+ XSS 正则（拒绝 `<script`/`<iframe`/`javascript:`） |
| 文件层 | MIME 真实验证（前 512 字节）+ 路径穿越防护 + 10MB 限大小 |
| 频率层 | 全局 100 req/s · 注册 ~3/min · 上传 ~20/min（内存限流） |
| CORS | 白名单制，开发环境 localhost:3000/5173 |
| 前端 | XSS 防护（React 默认转义）+ 敏感操作二次确认弹窗（删除排行/注销账号需输入确认文本） |

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| 状态管理 | Context + localStorage (无 Redux/Zustand) | 认证状态简单，通过自定义事件 `auth-change` 跨组件同步，无需额外依赖 |
| API 缓存 | 无 React Query/SWR（MVP 阶段） | 后端已实现、接口稳定，组件内 useState + useEffect 足够 |
| Mock 方式 | Vite proxy + 极少 MSW (仅 send-verify-code) | 后端已就绪，Mock 仅用于缺失的验证码接口 |
| 拖拽库 | @dnd-kit | 设计文档指定，支持跨容器拖拽和排序，社区活跃 |
| 样式方案 | Tailwind CSS + 自定义 Tier 色彩 | 设计文档指定，原子化 CSS 与 Luminous Precision 系统自然契合 |
| 路由 | react-router-dom v6 createBrowserRouter | 设计文档指定，嵌套布局 + 数据加载模式 |
| 前端 Dockerfile | nginx:alpine 服务静态文件 + API 代理 | docker-compose.yml 已定义，保持一致性 |
