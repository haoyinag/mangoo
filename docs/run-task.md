# runTask

`runTask` is the unified execution API in `mangoo`.

It has **two overloads**:

- function input (single workflow with task state)
- array input (parallel execution)

---

## 0) Terms You Will See Often

- `meta`: your business-side runtime metadata object.
- `meta.phase`: a common **user-defined** field in `meta` (not built-in by framework).
- `error.phase`: an `AsyncTaskError` field that indicates where error was tagged (e.g. `task`, `parallel`, `execution` in current implementation).
- `stepId`: error location identifier such as `runTask` or `parallel:2`.
- `status`: task lifecycle (`idle/running/success/error/aborted`) in function-input mode.

Important:
- `meta.phase` and `error.phase` are different concepts.
- same property name, different ownership and meaning.

---

## 1) Function Input Overload

## Signature

```ts
runTask<I, O, M extends Record<string, unknown>>(
  taskFn: TaskFn<I, O, M>,
  config?: TaskRunConfig<I, M>
): TaskHandleSimple<O, M>
```

## `taskFn`

```ts
type TaskFn<I, O, M> = (ctx: TaskContext<I, M>) => O | Promise<O>
```

### `ctx: TaskContext<I, M>`

```ts
interface TaskContext<I, M> {
  params: I
  signal: AbortSignal
  setMeta: (patch: Partial<M>) => void
  getMeta: () => M
}
```

- `params`: input payload for current run.
- `signal`: abort signal for cancellation-aware code.
- `setMeta(patch)`: shallow merges into current `meta` and emits state.
- `getMeta()`: returns a snapshot copy of current `meta`.

## `config`

```ts
interface TaskRunConfig<I, M> {
  params?: I
  signal?: AbortSignal
  meta?: M
}
```

- `params`: initial input passed to `ctx.params`.
- `signal`: parent signal; if aborted, task signal aborts too.
- `meta`: initial metadata object for this run.

## Return: `TaskHandleSimple<O, M>`

```ts
interface TaskHandleSimple<O, M> {
  readonly id: string
  readonly result: Promise<TaskResult<O, M>>
  cancel: (reason?: string) => void
  onState: (listener: (state: TaskState<O, M>) => void) => () => void
  getState: () => TaskState<O, M>
}
```

### fields

- `id`: runtime task id (e.g. `task_1`, `task_2`, ...).
- `result`: resolves when task ends (success/error/aborted).
- `cancel(reason?)`: abort current task signal (reason is passed to AbortController).
- `onState(listener)`: subscribe state updates, returns unsubscribe function.
- `getState()`: returns current state snapshot.

## `TaskState<O, M>`

```ts
type TaskStatus = 'idle' | 'running' | 'success' | 'error' | 'aborted'

interface TaskState<O, M> {
  status: TaskStatus
  loading: boolean
  data: O | undefined
  error: AsyncTaskError | null
  meta: M
  startedAt: number | null
  endedAt: number | null
}
```

### status transitions

- initial internal state: `idle`
- immediately after creation: `running`
- final: `success` or `error` or `aborted`

### timing fields

- `startedAt`: set when status enters `running`.
- `endedAt`: set when task settles.

## `TaskResult<O, M>`

```ts
interface TaskResult<O, M> {
  status: 'success' | 'error' | 'aborted'
  data: O | undefined
  error: AsyncTaskError | null
  meta: M
}
```

Important behavior:
- `task.result` resolves with status object.
- execution failures are represented in `status/error`, not thrown from `task.result`.
- `onState(listener)` immediately invokes `listener` once with current snapshot.

---

## 2) Array Input Overload (Parallel)

## Signature

```ts
runTask<I, O>(
  tasks: Array<ParallelTask<I, O>>,
  params?: I,
  options?: ParallelRunOptions
): Promise<O[]>
```

## `tasks`

```ts
type ParallelTask<I, O> = (ctx: ParallelTaskContext<I>) => O | Promise<O>

interface ParallelTaskContext<I> {
  params: I
  signal: AbortSignal
  index: number
}
```

- `params`: shared input for all sub-tasks.
- `signal`: shared cancellation signal.
- `index`: index of current sub-task in input array.

## `params` (2nd argument)

Shared payload passed to every sub-task as `ctx.params`.

## `options` (3rd argument)

```ts
interface ParallelRunOptions {
  concurrency?: number
  mode?: 'fail-fast' | 'collect-all'
  signal?: AbortSignal
}
```

### defaults

- `concurrency`: `8`
- `mode`: `'fail-fast'`

### validation

- `concurrency` must be a positive integer.
- invalid value throws `AsyncTaskError` with code `INVALID_CONCURRENCY`.

## Return value

`Promise<O[]>`

- resolves with ordered results (same order as input tasks)
- rejects depending on mode:
  - `fail-fast`: rejects first `AsyncTaskError`
  - `collect-all`: waits all and rejects `AggregateError` if any failed

---

## 3) Error Model (Both Modes)

```ts
interface AsyncTaskError {
  code: string
  message: string
  kind: 'abort' | 'network' | 'business' | 'unknown'
  stepId?: string
  phase?: string
  cause?: unknown
  aborted: boolean
}
```

### common codes in current implementation

- `ABORTED`
- `STEP_ERROR`
- `INVALID_CONCURRENCY`

### `phase` in errors

`error.phase` is assigned by runtime error wrapping, current common values:

- `task`: error wrapped in function-input mode
- `parallel`: error wrapped in array-input mode
- `execution`: abort-related wrapped errors

---

## 4) Cancellation Semantics

- cancellation is cooperative (`AbortSignal`).
- if your async layer ignores `signal`, underlying work may still continue.
- function mode:
  - manual cancel -> final status usually `aborted`
- array mode:
  - `fail-fast`: first failure aborts remaining via signal
  - `collect-all`: does not early-abort siblings by failure mode

---

## 5) `createRunner` Relationship

`createRunner({ concurrency, mode })` sets default values used by **array-input `runTask`**.

```ts
const runner = createRunner({ concurrency: 4, mode: 'collect-all' })

await runner.runTask([...]) // uses runner defaults unless overridden in options
```

---

## 6) Full Examples

## Example A: single workflow

```ts
const task = runTask(
  async ({ params, signal, setMeta }) => {
    setMeta({ phase: 'login' })
    const session = await api.login(params, { signal })

    setMeta({ phase: 'profile' })
    return api.getProfile(session.userId, { signal })
  },
  {
    params: { account: 'demo', password: '123456' },
    meta: { phase: 'init' }
  }
)

task.onState((s) => {
  console.log(s.status, s.loading, s.meta)
})

const result = await task.result
if (result.status === 'success') {
  console.log(result.data)
}
```

## Example B: parallel with shared params

```ts
const [profile, notices, vip] = await runTask(
  [
    ({ params, signal }) => api.getProfile(params.userId, { signal }),
    ({ params, signal }) => api.getNotices(params.userId, { signal }),
    ({ params, signal }) => api.getVipInfo(params.userId, { signal })
  ],
  { userId: 'u_1001' },
  { concurrency: 2, mode: 'fail-fast' }
)
```

---

## 7) Common Misunderstandings

- "`task.result` should throw on business error"
  - In function mode, it resolves with `status: 'error'`.
- "`params` in array mode is per-task"
  - It is shared; use `ctx.index` for index-specific behavior.
- "`cancel()` always stops network immediately"
  - Only if downstream request/client respects `signal`.
