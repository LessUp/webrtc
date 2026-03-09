# GitHub Pages 全面优化 & 代码质量增强

Date: 2026-03-09

## GitHub Pages

### _config.yml 全面升级
- 添加 `url` / `baseurl` 用于正确的站点 URL 生成
- 添加 `jekyll-seo-tag` 插件，自动生成 SEO meta 标签
- 配置 `lang: zh-CN`、`author`、`logo` 等 SEO 元数据
- 配置 kramdown GFM 渲染与 rouge 语法高亮
- 添加 `exclude` 列表，排除 Go 源码、Dockerfile 等非文档文件

### index.md（首页）重写
- 居中标题区域，带 badges 和快速导航链接
- 新增"项目简介"、"功能全景"表格（含阶段与状态）
- 新增"核心特性"表格（含安全防护特性）
- 新增"信令协议"消息类型表格
- 新增"文档导航"表格，链接至所有子页面
- 架构图改进对齐

### 文档页面 Jekyll frontmatter
- `docs/guide.md` — 添加 layout/title/description + 返回首页链接
- `docs/signaling.md` — 添加 layout/title/description + 返回首页链接
- `ROADMAP.md` — 添加 layout/title/description + 返回首页链接
- `CONTRIBUTING.md` — 添加 layout/title/description + 返回首页链接

### 新增页面
- `404.md` — 自定义 404 页面，带返回首页与 GitHub 链接
- `CHANGELOG.md` — 根目录变更日志索引页，带 Jekyll frontmatter

## Go 后端

### 新增 .golangci.yml
- 启用 errcheck、govet、staticcheck、gocritic、revive、misspell、prealloc 等 linter
- 配置 gocritic diagnostic+style tags，revive 规则

### 测试覆盖率大幅增强（+11 个测试用例）
- `TestHubAddClientIgnoresEmptyRoomOrID` — 空 room/id 忽略
- `TestHubRemoveClientIdempotent` — 重复 remove 幂等性
- `TestHubForwardToNonExistentRoom` — 转发到不存在的房间不 panic
- `TestHubForwardToNonExistentClient` — 转发到不存在的客户端静默丢弃
- `TestHubMultipleRoomsIsolation` — 多房间消息隔离
- `TestHubMaxRoomsLimit` — MaxRooms 上限验证
- `TestHubMaxClientsPerRoomLimit` — MaxClientsPerRoom 上限验证
- `TestHubForwardDropsWhenBufferFull` — send 缓冲满时静默丢弃
- `TestIsOriginAllowedInvalidURL` — 非法 Origin URL 拒绝
- `TestNewHubDefaultOptions` — 默认选项验证
- `TestNewHubWithOptionsCopiesSlice` — allowedOrigins 防御性拷贝验证

## CI/CD

### go.yml 工作流增强
- 新增独立 `lint` job，使用 golangci/golangci-lint-action@v6
- 测试 job 新增 `go mod verify` 步骤
- 测试增加 `-coverprofile=coverage.out` 覆盖率输出
- 添加 `permissions: contents: read` 最小权限
- 移除 staticcheck 单独安装步骤（已由 golangci-lint 覆盖）

## 前端

### HTML meta 标签增强
- 添加 `<meta name="description">` 描述标签
- 添加 `<meta name="theme-color">` 浅色/深色主题色
- 添加 SVG emoji favicon（🎥）

## 文档

### README.md (EN) 全面重写
- 添加 Go CI badge
- 添加在线文档链接
- Features 改为表格形式，新增 Security 特性
- 新增 Architecture 文本图
- 项目结构增加文件级描述
- Tech Stack 表格化
- Roadmap 按阶段细化

### README.zh-CN.md 全面重写
- 与英文版结构对齐
- 添加 CI badge、在线文档链接
- 特性/架构/配置/技术栈表格化
- 路线图按阶段细化

### docs/signaling.md 代码同步
- `writePump` 代码更新为当前 Client 方法签名（不再是 Hub 方法）
- `HandleWS` 代码更新为当前显式顺序清理（不再是 defer 模式）
- 4.1 节说明更新，匹配当前清理顺序

### CONTRIBUTING.md 增强
- 新增"开发环境"章节（前置要求、启动命令）
- 新增"测试与质量检查"章节（build / test / vet / lint 命令）
- 代码规范补充 `.golangci.yml` 说明
- 提交信息格式补充 `test:` 类型

### Files Modified
- `_config.yml`
- `index.md`
- `404.md` (new)
- `CHANGELOG.md` (new)
- `.golangci.yml` (new)
- `internal/signal/hub_test.go`
- `.github/workflows/go.yml`
- `web/index.html`
- `README.md`
- `README.zh-CN.md`
- `docs/guide.md`
- `docs/signaling.md`
- `ROADMAP.md`
- `CONTRIBUTING.md`
- `changelog/2026-03-09_pages-and-quality.md` (new)
