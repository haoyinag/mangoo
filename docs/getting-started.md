# Getting Started

`mangoo` is a lightweight guardrail layer for async workflows.

## Install

```bash
npm install mangoo
```

```ts
import { runTask, createRunner } from 'mangoo';
import { useTask as useReactTask } from 'mangoo/react';
import { useTask as useVueTask } from 'mangoo/vue';
```

## Single task mode

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

## Parallel mode with the same API

Pass an array to `runTask` and it executes in parallel:

```ts
const [notices, vip] = await runTask(
  [
    ({ signal }) => api.getNotices({ signal }),
    ({ signal }) => api.getVipInfo({ signal })
  ],
  undefined,
  { concurrency: 2, mode: 'fail-fast' }
);
```

## Next steps

- Read [Core Concepts](/core-concepts)
- Read [runTask](/run-task)
- Read [React: useTask](/react) or [Vue: useTask](/vue)
