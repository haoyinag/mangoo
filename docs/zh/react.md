# React 用法

## 导入

```ts
import { useTask } from 'mangoo/react';
```

## 函数模式

```tsx
const task = useTask(
  async ({ params, signal, setMeta }) => {
    setMeta({ phase: 'saving' });
    return api.save(params, { signal });
  },
  { concurrency: 4, mode: 'fail-fast' },
  { phase: 'idle' }
);
```

## 数组模式（并发）

```tsx
const task = useTask(
  [
    ({ params, signal }) => api.getProfile(params.userId, { signal }),
    ({ params, signal }) => api.getNotices(params.userId, { signal })
  ],
  { concurrency: 2, mode: 'fail-fast' }
);

const result = await task.run({ userId: 'u1' });
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
