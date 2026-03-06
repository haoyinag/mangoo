# mangoo

`mangoo` 是一个“原生优先”的异步处理库。

## 当前状态

- 基线版本：`v0.1`（已锁定）
- 当前研发轨道：`v0.2-draft`（已落 P0+P1）

## 当前主 API

- `runTask`
- `runParallel`
- `createRunner`
- `useTask`（`mangoo/react`）
- `useTask`（`mangoo/vue`）

## 设计原则

1. 业务主线保持原生 `async/await`
2. 统一状态/取消/并发/错误护栏
3. 核心层框架无关
4. 核心层请求库无关

## 官方文档

- 站点源码：[`docs/`](./docs)
- 历史 Markdown 文档集：[`official/`](./official)

## 使用指南

- [official/USAGE_REACT.zh-CN.md](./official/USAGE_REACT.zh-CN.md)
- [official/USAGE_VUE.zh-CN.md](./official/USAGE_VUE.zh-CN.md)

## 常用命令

```bash
npm install mangoo
npm test
npm run build
npm run docs:dev
npm run docs:build
```

## 文档部署

- GitHub Actions 工作流： [`.github/workflows/docs.yml`](./.github/workflows/docs.yml)
- 默认通过 `DOCS_BASE` 按仓库名设置 Pages 基础路径。
