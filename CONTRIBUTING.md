---
layout: default
title: 贡献指南 — WebRTC
description: WebRTC 项目贡献流程、代码规范与提交信息格式
---

[← 返回首页]({{ site.baseurl }}/)

# Contributing

感谢你对本项目的关注！欢迎通过 Issue 和 Pull Request 参与贡献。

## 开发流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m "feat: add your feature"`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

## 开发环境

### 前置要求

- Go 1.22+
- 浏览器（Chrome / Edge / Firefox 最新版）
- （可选）[golangci-lint](https://golangci-lint.run/welcome/install/) 用于本地 lint

### 启动开发服务

```bash
go mod tidy
go run ./cmd/server
# 浏览器访问 http://localhost:8080
```

## 测试与质量检查

提交前请确保以下检查全部通过：

```bash
# 构建
go build ./...

# 单元测试（Linux/macOS 支持 -race）
go test -race -count=1 ./...

# 静态分析
go vet ./...

# Lint（需安装 golangci-lint）
golangci-lint run
```

CI 会自动运行 golangci-lint、多版本 Go 测试和 staticcheck。

## 代码规范

- Go 代码遵循 `gofmt` 和 `go vet` 规范
- Lint 规则定义在 `.golangci.yml`
- 使用 `.editorconfig` 中定义的缩进和格式规则
- 前端代码保持简洁，避免引入重型框架
- 确保构建和测试无错误

## 提交信息格式

推荐使用 [Conventional Commits](https://www.conventionalcommits.org/)：

- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档更新
- `refactor:` 重构
- `test:` 测试
- `chore:` 构建/工具链
