# API 参考

## 核心（`mangoo`）

### `runTask(taskFn, config?)`

运行单个异步流程，返回带状态的任务句柄。

### `runTask(tasks, params?, options?)`

运行并发子任务，支持并发上限和失败策略。

- `params`：共享入参，会传给每个子任务的 `ctx.params`
- `options`：`{ concurrency, mode, signal }`

### `createRunner(options?)`

```ts
createRunner({
  concurrency?: number; // 默认 8
  mode?: 'fail-fast' | 'collect-all'; // 默认 fail-fast
});
```

返回：

```ts
{
  runTask
}
```

## React / Vue

### `useTask(taskInput, options?, initialMeta?)`

`taskInput` 支持：
- `taskFn`
- `tasks[]`

返回字段：
- `taskId`
- `status`
- `loading`
- `data`
- `error`
- `meta`
- `run`
- `execute`
- `cancel`
- `reset`
