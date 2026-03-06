# React: useTask

## Import

```ts
import { useTask } from 'mangoo/react';
```

## Function input mode

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

## Array input mode

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

## Returned fields

- `taskId`
- `status`
- `loading`
- `data`
- `error`
- `meta`
- `run`
- `execute` (`run` alias)
- `cancel`
- `reset`

## Behavior notes

- calling `run` again cancels previous run (`replaced_by_new_run`)
- unmount cancels current run (`component_unmounted`)
