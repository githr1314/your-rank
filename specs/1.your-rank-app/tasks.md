# Your Rank 全栈应用 — 任务清单

## 任务版本

| 日期         | 版本 | 说明     |
| ------------ | ---- | -------- |
| 2026-06-30 | v1   | 初始任务 — 前端重写 + 后端补全 |

## 项目信息

- 项目名: your-rank
- 架构类型: Monorepo（前后端分离）
- 前端路径: frontend/
- 后端路径: backend/
- specs 路径: specs/1.your-rank-app/

## 后端任务

### 补全缺失接口

- [ ] T-BE-001: 实现 `POST /api/v1/auth/send-verify-code` 接口 ~30min
  - 输入: `{ email }`
  - 逻辑: 生成 6 位随机数字验证码，存储到 users 表 verify_code + verify_code_expire（有效期 10 分钟），通过 SMTP 发送到邮箱
  - 约束: 同一邮箱 1 小时内最多发送 3 次，验证码错误超 5 次自动作废
  - 需在 `router.go` 中注册公开路由

### 已有接口验证

- [ ] T-BE-002: 已有接口全面验证与前端对齐 ~1h
  - 逐接口验证请求/响应格式与 `api-contract.yaml` 一致
  - 重点验证: 分页返回 `{ items, total }` 格式、条目 tier 字段支持 null、分享码 8 位固定长度
  - 修复注册接口缺少验证码校验逻辑的问题（当前 handler 直接注册，未校验 verify_code）
  - 补充 `GET /api/v1/rankings/{id}` 的可见性权限校验（私密排行仅创建者可查看）

## 前端任务

### 项目初始化 & 基础设施

- [ ] T-FE-001: 前端项目初始化 ~1h
  - 使用 Vite 5 创建 React 18 + TypeScript 项目
  - 安装依赖: react-router-dom v6, axios, @dnd-kit/core, @dnd-kit/sortable, tailwindcss 3, tailwind-merge, tailwindcss-animate, Radix UI (Avatar/Dialog/DropdownMenu/Label/Separator/Slot/Tabs/Tooltip), react-hot-toast, qrcode, html2canvas
  - 配置 Tailwind 主题色（Tier S/A/B/C/D 色、Luminous Precision 中性色、玻璃态背景）
  - 配置 vite.config.ts: 路径别名 `@/` → `src/`，Vite proxy `/api` → `http://localhost:8080/api/v1`
  - 配置 axios 实例: baseURL, JWT 注入拦截器, 401 响应拦截器自动跳转登录
  - 创建目录结构: `src/pages/`, `src/components/`, `src/hooks/`, `src/services/`, `src/types/`, `src/utils/`

### 公共组件 & 鉴权

- [ ] T-FE-002: 公共组件开发 ~1h
  - `Navbar`: Logo + 导航链接 (发现/我的排行) + 用户头像下拉菜单 (个人中心/退出登录) + 玻璃态毛玻璃效果
  - `AuthContext` + `useAuth`: 基于 localStorage JWT token + `auth-change` 自定义事件
  - `AuthGuard`: 路由鉴权守卫组件，未登录重定向到 `/login`
  - `Toast`: react-hot-toast 全局配置
  - `ConfirmDialog`: Radix Dialog 二次确认弹窗（用于删除排行/条目/注销账号）
  - `EmptyState`: 空行占位提示（虚线边框 + "拖拽条目到此处"）
  - `ImageUploader`: 图片上传组件（点击/拖拽/粘贴三种方式，本地 canvas 压缩长边≤1920px，圆形/方形裁剪，进度条，多尺寸回显）

### API 服务层

- [ ] T-FE-003: API 服务层封装 ~30min
  - `services/authAPI.ts`: register, login, sendVerifyCode
  - `services/rankingAPI.ts`: listPublic, listMy, getById, create, update, delete
  - `services/entryAPI.ts`: create, update, delete, reorder
  - `services/uploadAPI.ts`: upload, batchUpload
  - `services/profileAPI.ts`: updateProfile, updatePassword, deleteAccount
  - `services/shareAPI.ts`: getByShareCode
  - TypeScript 类型定义 `types/`: User, Ranking, Entry, Image 等与 api-contract.yaml 对齐

### 页面开发

- [ ] T-FE-004: 登录 & 注册页面 ~1h
  - `LoginPage`: 邮箱/用户名切换 + 密码输入 + "记住我"复选框 + 登录按钮 → 成功后跳转 `/home`
  - `RegisterPage`: 用户名 + 邮箱 + 密码 + 验证码输入 + "发送验证码"按钮（60s 倒计时）+ 注册按钮 → 成功后自动登录
  - 表单校验: 用户名 2-20 字符、邮箱格式、密码 8-32 字符含字母+数字

- [ ] T-FE-005: 发现页 ~1h
  - `DiscoverPage`: 顶部搜索栏（关键词搜索）+ 分类标签筛选行（全部/游戏/影视/音乐/美食/运动/科技/其他）
  - `RankingCardGrid`: 四列卡片网格，每张卡片展示封面缩略图、标题、条目总数、等级分布概览、浏览热度
  - 无限滚动: IntersectionObserver 检测底部，自动加载下一页（分页 20 条/页）
  - 空状态: 搜索无结果时展示引导提示

- [ ] T-FE-006: 我的排行榜页 + 创建排行榜页 ~1h
  - `MyRankingsPage`: 卡片网格展示我的排行（与发现页结构一致，增加"创建新排行"入口卡片），支持分类筛选和排序（创建时间/更新时间）
  - `CreateRankingPage`: 标题（必填 1-100 字符）+ 描述（选填）+ 封面图上传 + 分类标签选择（下拉）+ 可见范围（公开/私密/仅链接 单选），创建成功后跳转管理页
  - 删除排行榜: 点击删除 → ConfirmDialog 二次确认 → 输入标题确认 → 删除成功回调列表

- [ ] T-FE-007: 排行管理页（核心拖拽页面） ~3h
  - **布局硬约束**: 页面 `h-screen overflow-hidden`，无纵向滚动条
  - `TopBar`: ← 返回按钮 + 面包屑导航 (我的排行 > 排行标题) + 分享按钮 + 更多菜单 (删除排行)
  - `RankingInfoBar`: 标题输入框 + 分类选择 + 可见范围切换（可折叠/展开）
  - `AddEntryButton`: 添加条目按钮 → 弹出创建表单 → 创建后进入待放置区
  - **`DragDropCore`**: `flex: 1` 占满剩余视口高度
    - 5 个 `TierRow` + 1 个 `PendingZone` = 6 个区域按百分比均分高度 (14%/14%/14%/14%/14%/16%, min 120px)
    - `TierRow`: 左侧 TierBadge（S/A/B/C/D 等级徽章）+ 右侧 EntryCardList（`overflow-x: auto` 横向滚动容器）
    - `PendingZone`: 待放置区，新条目默认进入，可拖入等级行
    - 空行显示 `EmptyState` 虚线占位 + "拖拽条目到此处" 提示
  - **拖拽交互**:
    - `@dnd-kit/core` DndContext + 多个 `useDroppable` 行容器 + `useSortable` 条目卡片
    - 抓起卡片: `scale(1.05)` + 阴影加深 `0 4px 24px rgba(0,0,0,0.04)`
    - 经过目标行: 边框高亮 + 行内卡片自动让出空位
    - 释放入行: 卡片落入 + 等级徽章即时切换
    - 拖入删除区: 确认弹窗 → 确认后删除
  - **保存策略**: 拖拽释放后 800ms 防抖调用 `PUT /entries/reorder`，保存中底部状态栏显示"保存中..."，成功后"✓ 已保存" 2s 淡出，失败回滚并提示
  - **未保存保护**: `beforeunload` + `useBlocker` 拦截，弹出确认提示"未保存变更"

- [ ] T-FE-008: 排行详情页（只读） + 分享页 ~1h
  - `RankingDetailPage`: 完整展示 Tier List（只读），根据 visibility 校验访问权限
  - `SharePage (/s/:code)`: 通过分享码调用 `GET /share/{code}` 获取数据，纯展示 Tier List 全貌
    - 底部: 创建者信息 + "由 Your Rank 生成" + "自己也来创建一个 →" CTA 入口
    - 分享海报生成: qrcode 生成分享链接二维码 + html2canvas 合成封面+标题+完整 Tier List 截图+二维码的长图

- [ ] T-FE-009: 个人中心页 ~45min
  - `ProfilePage`: 头像编辑（上传+裁剪）+ 昵称/简介编辑 + 修改密码（旧密码+新密码表单）+ 注销账号按钮
  - 注销账号: ConfirmDialog 二次确认 → 确认后调用 `DELETE /profile` → 清除登录态 → 跳转首页

### 前端测试

- [ ] T-FE-010: 核心交互测试 ~30min
  - 拖拽交互: 跨行拖拽等级变更、行内排序、拖入待放置区、拖入删除区
  - 保存防抖: 800ms 防抖行为验证
  - 未保存保护: 页面关闭/跳转拦截
  - 图片上传: 点击/拖拽/粘贴三种方式及错误提示

## 联调 & 集成

- [ ] T-INT-001: 前后端联调 ~1h
  - 逐接口从前端发起请求 → 检查后端响应格式与 api-contract.yaml 一致
  - 重点: 注册/登录 JWT 流程、条目 reorder 批量更新、分享码访问
  - 修复联调中发现的格式不一致问题

- [ ] T-INT-002: 端到端流程验收 ~30min
  - 完整流程: 注册 → 登录 → 创建排行榜 → 上传封面 → 添加 3+ 条目 → 拖拽分级 → 保存 → 分享链接 → 无痕窗口打开分享页验证
  - 异常流程: 错误密码登录 → 锁定提示 → 未登录访问管理页 → 跳转登录 → 登录后回调原页面
  - 删除流程: 删除条目（确认弹窗） → 删除排行榜（输入标题确认） → 验证发现页不再出现

## 依赖关系

```
T-BE-001 (send-verify-code) ──→ T-FE-004 (注册页验证码功能)
                                    │
T-FE-001 (项目初始化) ──────────────→ T-FE-002 (公共组件) ──→ T-FE-004~009 (页面)
                                    │
T-FE-003 (API 服务层) ─────────────→ T-FE-004~009 (页面依赖 API 层)
                                    │
T-FE-004~009 (页面完成) ───────────→ T-FE-010 (交互测试)
                                    │
全部 FE + BE 完成 ─────────────────→ T-INT-001 (联调) ──→ T-INT-002 (验收)
```

- 前端页面依赖 T-FE-002 (公共组件) 和 T-FE-003 (API 层) — 非阻塞，可在同一迭代中并行推进
- T-FE-007 (管理页) 是核心页面，优先分配有拖拽经验的开发者
- 联调依赖前后端均完成

## 风险点

| 风险 | 级别 | 应对 |
|------|------|------|
| @dnd-kit 跨容器拖拽 + 横向滚动兼容 | 中 | 提前验证 @dnd-kit 在横向 overflow 容器中的拖拽行为，准备降级方案（自定义 drag overlay） |
| 100vh 无滚动布局在小屏设备上体验 | 中 | 设置每行 min-height: 120px 硬底线，小屏(<768px)降级为首屏只读模式 + 管理功能引导至桌面端 |
| 图片上传 + 压缩在前端性能 | 低 | canvas 压缩异步 Worker 线程，不阻塞主 UI |
| send-verify-code 后端需 SMTP 服务 | 中 | 如无 SMTP 可用，开发阶段返回固定验证码 123456，生产环境再接入真实 SMTP |
