# API Reference

## Core (`mangoo`)

### `runTask(taskFn, config?)`

Run a single workflow with task state and cancellation.

### `runTask(tasks, params?, options?)`

Run multiple tasks in parallel with concurrency and error mode control.

- `params`: shared input object passed to every sub-task as `ctx.params`
- `options`: `{ concurrency, mode, signal }`

### `createRunner(options?)`

```ts
createRunner({
  concurrency?: number; // default 8
  mode?: 'fail-fast' | 'collect-all'; // default fail-fast
});
```

Returns:

```ts
{
  runTask
}
```

## React (`mangoo/react`) / Vue (`mangoo/vue`)

### `useTask(taskInput, options?, initialMeta?)`

`taskInput` can be:
- `taskFn`
- `tasks[]`

Returns:

```ts
{
  taskId,
  status,
  loading,
  data,
  error,
  meta,
  run,
  execute,
  cancel,
  reset
}
```

## Core types

```ts
type TaskStatus = 'idle' | 'running' | 'success' | 'error' | 'aborted';
```

```ts
interface AsyncTaskError {
  code: string;
  message: string;
  kind: 'abort' | 'network' | 'business' | 'unknown';
  stepId?: string;
  phase?: string;
  cause?: unknown;
  aborted: boolean;
}
```
