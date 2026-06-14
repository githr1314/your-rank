# LESSONS — Your Rank 全栈开发经验

## 架构决策

### L-001: Schema 先行是可行的
**日期**: 2026-06-14
**内容**: api-contract.yaml 作为前后端唯一真相源，前端 types/index.ts 和 Go models 严格对齐。开发过程中前后端完全解耦，Mock 模式让前端不被后端阻塞。本次开发中前端 api.ts 预定义了所有 API 函数签名，后端开发完后只需 `/clear` 切真实 API 即可。
**标签**: `architecture` `api-contract`

### L-002: 并行 Agent 编排节省 50%+ 时间
**日期**: 2026-06-14
**内容**: 后端 (Go) 和前端 (React) 天然隔离，使用两个独立 Agent 并行执行 N4/N5。后端 ~8min、前端 ~8min 同时完成，而非串行的 ~16min。前提是 API 契约事先对齐、Mock 策略清晰。
**标签**: `workflow` `parallel`

## 技术坑

### L-003: Go `imaging` 库依赖 CGO
**日期**: 2026-06-14
**内容**: `github.com/disintegration/imaging` 依赖 `golang.org/x/image`，纯 Go 实现无 CGO 依赖，可正常编译。但在 Docker Alpine 镜像中可能需要安装额外的图像库支持（如 libjpeg-turbo）。建议后端 Dockerfile 使用 `golang:1.22-alpine` + `apk add libjpeg-turbo`。
**标签**: `backend` `dependencies`

### L-004: html2canvas 对 CSS 渐变/backdrop-blur 支持有限
**日期**: 2026-06-14
**内容**: SharePosterModal 中使用 html2canvas 截图，需要避免 `backdrop-blur`、`mix-blend-mode` 等高级 CSS 特性。隐藏海报模板中使用纯色背景而非半透明效果来绕过此限制。生产环境测试时需验证实际截图效果。
**标签**: `frontend` `share-poster`

### L-005: axios DELETE 请求体需用 `data` 配置项
**日期**: 2026-06-14
**内容**: `axios.delete(url, { data: body })` 而非 `axios.delete(url, body)`。联调时发现 `deleteAccount` 没有发送 `{confirm: true}` 请求体，后端因此拒绝请求。已修复。
**标签**: `frontend` `api` `axios`

## 安全

### L-006: 验证码 Mock 模式的并发问题
**日期**: 2026-06-14
**内容**: 使用 `sync.Map` 存储验证码缓存时，`Attempts++` 非原子操作。高并发下多个请求可能读到相同的 Attempts 值。Mock 模式可接受，生产环境需替换为 Redis + Lua 原子操作。
**标签**: `security` `verify-code` `concurrency`

### L-007: 设备级注册限流依赖客户端 Header
**日期**: 2026-06-14
**内容**: `X-Device-ID` 头由前端设置，恶意用户可轻易绕过。生产环境应结合 IP + 设备指纹（canvas fingerprint）等更可靠的手段。
**标签**: `security` `rate-limit`

## 测试

### L-008: 需要尽快搭建测试框架
**日期**: 2026-06-14
**内容**: 项目当前零测试基础设施。Go 端已有 handler_test.go 骨架（4 个 httptest case），前端完全无测试。建议优先搭建：后端 `httptest` + `testify`、前端 `vitest` + `@testing-library/react`。核心拖拽逻辑（sort_order 重算、防抖保存）必须有测试覆盖。
**标签**: `testing` `tech-debt`

## 未配置项（技术债）

- [ ] Go: `go mod tidy` 运行 + go.sum 生成（当前环境无 Go）
- [ ] 前端: `npm install` 安装 qrcode/html2canvas 新依赖
- [ ] TypeScript 编译验证: `npm run build`
- [ ] Go 编译验证: `go build ./cmd/server`
- [ ] 前端 ESLint/Prettier 配置
- [ ] 后端 golangci-lint 配置
- [ ] 前端 vitest + testing-library 搭建
- [ ] 后端 testify + httptest 扩展
- [ ] E2E 测试（Playwright）搭建
