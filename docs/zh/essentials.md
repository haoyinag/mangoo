# 核心概念

## 一个 API，两种模式

`runTask` 同时支持：
- 传入函数：返回 `TaskHandleSimple`（有状态）
- 传入数组：返回 `Promise<O[]>`（并发执行）

## 状态模型

函数模式下，任务状态统一为：
- `status`: `idle | running | success | error | aborted`
- `loading`
- `data`
- `error`
- `meta`
- `startedAt` / `endedAt`

## 取消模型

取消基于 `AbortSignal`，属于协作式机制：
- 你调用 `cancel()` 只会触发中断信号
- 请求是否立即停止，取决于底层是否使用 `signal`

## 并发模型

数组模式支持：
- `concurrency`（必须是正整数）
- `mode`: `fail-fast | collect-all`

## Runner 默认值

`createRunner({ concurrency, mode })` 只影响数组模式下的 `runTask` 默认配置。
