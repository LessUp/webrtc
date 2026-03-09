# 2026-03-10 GitHub Pages 优化

## 修复

1. **CI badge URL 修正** — `README.md`、`README.zh-CN.md`、`index.md` 中 badge 链接从不存在的 `go.yml` 修正为实际的 `ci.yml`
2. **项目结构描述修正** — 三处项目结构树中 `go.yml` → `ci.yml`
3. **`_config.yml` 移除不存在的 logo** — `assets/og-banner.png` 文件不存在，移除引用避免 SEO 元数据指向 404
4. **`.gitignore` 补充 Jekyll 产物** — 添加 `_site/`、`.jekyll-cache/`、`.jekyll-metadata`

## 优化

5. **`pages.yml` cancel-in-progress** — `false` → `true`，避免过时提交的部署阻塞新提交
6. **`pages.yml` paths 触发补全** — 添加 `changelog/**`、`404.md` 路径触发，确保子页面变更也触发部署
7. **`pages.yml` sparse-checkout 补全** — 添加 `404.md`，确保 404 页面正确部署
8. **`_config.yml` exclude 补全** — 添加 `.vscode/`、`.github/`、`_site/`、`.jekyll-cache/`，减少 Jekyll 构建范围
9. **添加 Pages badge** — `README.md`、`README.zh-CN.md`、`index.md` 添加 GitHub Pages 部署状态徽章
