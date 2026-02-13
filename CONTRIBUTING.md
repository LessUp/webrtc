# Contributing

感谢你对本项目的关注！欢迎通过 Issue 和 Pull Request 参与贡献。

## 开发流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m "feat: add your feature"`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

## 开发与测试

```bash
go mod tidy
go run ./cmd/server
```

## 代码规范

- Go 代码遵循 `gofmt` 和 `go vet` 规范
- 使用 `.editorconfig` 中定义的缩进和格式规则
- 前端代码保持简洁，避免引入重型框架
- 确保构建无错误

## 提交信息格式

推荐使用 [Conventional Commits](https://www.conventionalcommits.org/)：

- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档更新
- `refactor:` 重构
- `chore:` 构建/工具链
