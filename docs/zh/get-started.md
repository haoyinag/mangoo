# 10 分钟上手

## 1. 安装

```bash
npm install mangoo
```

```ts
import { runTask, createRunner } from 'mangoo';
import { useTask as useReactTask } from 'mangoo/react';
import { useTask as useVueTask } from 'mangoo/vue';
```

## 2. 单任务模式

```ts
const task = runTask(
  async ({ params, signal, setMeta }) => {
    setMeta({ phase: 'login' });
    const session = await api.login(params, { signal });

    setMeta({ phase: 'profile' });
    return api.getProfile(session.userId, { signal });
  },
  { params: { account: 'demo', password: '123456' }, meta: { phase: 'init' } }
);

const result = await task.result;
```

## 3. 并发模式（仍然是 runTask）

```ts
const [notices, profile] = await runTask(
  [
    ({ signal }) => api.getNotices({ signal }),
    ({ signal }) => api.getProfile({ signal })
  ],
  undefined,
  { concurrency: 2, mode: 'fail-fast' }
);
```

## 4. 记住一条原则

对外只用两个入口：
- 执行：`runTask`
- 组件：`useTask`
