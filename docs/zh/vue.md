# Vue 用法

## 导入

```ts
import { useTask } from 'mangoo/vue';
```

## 函数模式

```ts
const task = useTask(
  async ({ params, signal, setMeta }) => {
    setMeta({ phase: 'loading' });
    return api.fetchDetail(params.id, { signal });
  },
  { concurrency: 4, mode: 'fail-fast' },
  { phase: 'idle' }
);
```

## 数组模式（并发）

```ts
const task = useTask(
  [
    ({ params, signal }) => api.getProfile(params.userId, { signal }),
    ({ params, signal }) => api.getNotices(params.userId, { signal })
  ],
  { concurrency: 2, mode: 'fail-fast' }
);

await task.run({ userId: 'u1' });
```

## 返回字段

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
