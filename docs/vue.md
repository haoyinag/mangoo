# Vue: useTask

## Import

```ts
import { useTask } from 'mangoo/vue';
```

## Function input mode

```vue
<script setup lang="ts">
import { useTask } from 'mangoo/vue';

const task = useTask(
  async ({ params, signal, setMeta }) => {
    setMeta({ phase: 'loading' });
    return api.fetchDetail(params.id, { signal });
  },
  { concurrency: 4, mode: 'fail-fast' },
  { phase: 'idle' }
);
</script>
```

## Array input mode

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

## Returned fields

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
