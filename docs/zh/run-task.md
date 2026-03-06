# runTask

`runTask` 是 `mangoo` 的统一执行 API。

它有两种重载：

- 传函数：单任务模式（有状态）
- 传数组：并发模式（无任务句柄，返回 Promise）

---

## 0）术语先看懂（最容易混淆）

- `meta`：你自己维护的“运行中元信息对象”。
- `meta.phase`：`meta` 里的业务字段，通常用于展示当前步骤（如 `login/profile/done`）。这不是框架内置字段。
- `error.phase`：`AsyncTaskError` 上的系统字段，表示错误被标记的执行阶段（当前实现常见：`task`、`parallel`、`execution`）。
- `stepId`：错误位置标识，比如 `runTask`、`parallel:2`。
- `status`：任务状态机（函数模式下）`idle/running/success/error/aborted`。

重点：
- `meta.phase` 和 `error.phase` 完全不是一个东西。
- 只是同名 `phase`，含义和来源不同。

---

## 1）函数入参重载（单任务模式）

## 签名

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

- `params`：本次任务的输入参数。
- `signal`：取消信号。
- `setMeta(patch)`：浅合并更新 `meta`，并触发状态通知。
- `getMeta()`：获取当前 `meta` 的快照副本。

## `config`

```ts
interface TaskRunConfig<I, M> {
  params?: I
  signal?: AbortSignal
  meta?: M
}
```

- `params`：初始输入，会映射到 `ctx.params`。
- `signal`：父级信号，父级中断会联动中断当前任务。
- `meta`：本次任务的初始元信息。

## 返回值：`TaskHandleSimple<O, M>`

```ts
interface TaskHandleSimple<O, M> {
  readonly id: string
  readonly result: Promise<TaskResult<O, M>>
  cancel: (reason?: string) => void
  onState: (listener: (state: TaskState<O, M>) => void) => () => void
  getState: () => TaskState<O, M>
}
```

### 字段说明

- `id`：运行时任务 ID（如 `task_1`、`task_2`）。
- `result`：任务结束后返回结果对象。
- `cancel(reason?)`：主动中断当前任务（`reason` 会传入 AbortController）。
- `onState(listener)`：订阅状态变化，返回取消订阅函数。
- `getState()`：获取当前状态快照。

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

### 状态流转

- 初始内部状态：`idle`
- 创建后立即进入：`running`
- 结束状态：`success` / `error` / `aborted`

### 时间字段

- `startedAt`：进入 `running` 时写入。
- `endedAt`：任务最终结束时写入。

## `TaskResult<O, M>`

```ts
interface TaskResult<O, M> {
  status: 'success' | 'error' | 'aborted'
  data: O | undefined
  error: AsyncTaskError | null
  meta: M
}
```

关键行为：
- 函数模式下，`task.result` 通过 `status/error` 表达失败。
- 不依赖 `throw` 来表达任务执行失败。
- `onState(listener)` 在订阅瞬间会先立刻触发一次当前快照。

---

## 2）数组入参重载（并发模式）

## 签名

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

- `params`：所有子任务共享的输入参数。
- `signal`：所有子任务共享的取消信号。
- `index`：当前子任务在数组中的索引。

## `params`（第二个参数）

共享入参，会传给每个子任务的 `ctx.params`。

## `options`（第三个参数）

```ts
interface ParallelRunOptions {
  concurrency?: number
  mode?: 'fail-fast' | 'collect-all'
  signal?: AbortSignal
}
```

### 默认值

- `concurrency`：`8`
- `mode`：`'fail-fast'`

### 校验规则

- `concurrency` 必须是正整数。
- 非法时抛出 `AsyncTaskError`，`code = 'INVALID_CONCURRENCY'`。

## 返回值

`Promise<O[]>`

- 成功时：返回结果数组，顺序与输入任务顺序一致。
- 失败时：
  - `fail-fast`：第一个失败立即 `reject(AsyncTaskError)`
  - `collect-all`：等待全部结束后，若有失败则 `reject(AggregateError)`

---

## 3）错误模型（两种模式都适用）

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

### 当前实现中的常见 `code`

- `ABORTED`
- `STEP_ERROR`
- `INVALID_CONCURRENCY`

### `error.phase` 当前常见值

- `task`：函数模式执行时封装的错误
- `parallel`：并发模式执行时封装的错误
- `execution`：中断相关错误

---

## 4）取消语义

- 取消是协作式（`AbortSignal`），不是强制终止线程。
- 下游如果不消费 `signal`，任务可能仍继续执行。
- 函数模式：`cancel()` 后通常以 `aborted` 结束。
- 并发模式：
  - `fail-fast` 遇到首个错误会中断其余子任务
  - `collect-all` 不会因某个失败而提前中断全部任务

---

## 5）与 `createRunner` 的关系

`createRunner({ concurrency, mode })` 用于设置数组模式下 `runTask` 的默认并发配置。

```ts
const runner = createRunner({ concurrency: 4, mode: 'collect-all' })

await runner.runTask([...]) // 未显式传 options 时使用默认值
```

---

## 6）完整示例

## 示例 A：单任务模式

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

## 示例 B：并发模式（带共享 params）

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

## 7）完整业务流示例（你给的登录到首页流程）

下面这段示例按流程实现：
获取二维码 -> 输入帐号密码登录 -> 跳转首页 -> 并发获取轮播图/公告/商品/VIP

```ts
import { runTask } from "mangoo";

type LoginInput = {
  account: string;
  password: string;
};

type LoginMeta = {
  phase: "init" | "qr" | "login" | "token" | "home-parallel" | "done";
  qrUrl?: string;
};

type HomeData = {
  banners: Array<{ id: string; imageUrl: string }>;
  notices: Array<{ id: string; title: string }>;
  products: Array<{ id: string; name: string; price: number }>;
  vip: { level: string; expiresAt: string };
};

// 这些 API 仅示意签名，实际替换为你项目 API
declare function getLoginQrCode(signal?: AbortSignal): Promise<{ qrId: string; qrUrl: string }>;
declare function loginByPassword(input: LoginInput, qrId: string, signal?: AbortSignal): Promise<{ sessionId: string }>;
declare function getToken(sessionId: string, signal?: AbortSignal): Promise<{ accessToken: string }>;
declare function fetchBannerList(token: string, signal?: AbortSignal): Promise<HomeData["banners"]>;
declare function fetchNoticeList(token: string, signal?: AbortSignal): Promise<HomeData["notices"]>;
declare function fetchProductList(token: string, signal?: AbortSignal): Promise<HomeData["products"]>;
declare function fetchVipInfo(token: string, signal?: AbortSignal): Promise<HomeData["vip"]>;
declare function navigateToHome(payload: { token: string; homeData: HomeData }): void;

const loginTask = runTask<LoginInput, { token: string; homeData: HomeData }, LoginMeta>(
  async ({ params, signal, setMeta }) => {
    // 1) 获取二维码
    setMeta({ phase: "qr" });
    const qr = await getLoginQrCode(signal);
    setMeta({ qrUrl: qr.qrUrl });

    // 2) 输入账号密码登录
    setMeta({ phase: "login" });
    const session = await loginByPassword(params, qr.qrId, signal);

    // 3) 获取 token（作为首页请求凭证）
    setMeta({ phase: "token" });
    const tokenRes = await getToken(session.sessionId, signal);

    // 4) 跳转首页前并发拉取首页需要的数据
    setMeta({ phase: "home-parallel" });
    const [banners, notices, products, vip] = await runTask(
      [
        () => fetchBannerList(tokenRes.accessToken, signal),
        () => fetchNoticeList(tokenRes.accessToken, signal),
        () => fetchProductList(tokenRes.accessToken, signal),
        () => fetchVipInfo(tokenRes.accessToken, signal)
      ],
      undefined,
      { concurrency: 2, mode: "fail-fast", signal }
    );

    const homeData: HomeData = { banners, notices, products, vip };

    // 5) 跳转首页
    navigateToHome({ token: tokenRes.accessToken, homeData });
    setMeta({ phase: "done" });

    return { token: tokenRes.accessToken, homeData };
  },
  {
    // 初始输入（由页面表单替换）
    params: { account: "demo", password: "123456" },
    // 初始 meta
    meta: { phase: "init" }
  }
);

// 可选：订阅状态（用于 UI）
const off = loginTask.onState((state) => {
  console.log("status =", state.status);
  console.log("phase =", state.meta.phase);
  console.log("error =", state.error?.message);
});

const result = await loginTask.result;
off();

if (result.status === "success") {
  console.log("登录与首页初始化完成", result.data);
}
```

---

## 8）高频误区

- “`task.result` 应该抛业务异常”
  - 函数模式里，失败通过 `status: 'error'` + `error` 返回。
- “数组模式第二个参数是每个任务单独的 params”
  - 不是，它是共享参数；单任务差异可用 `ctx.index` 区分。
- “`cancel()` 一定立刻停请求”
  - 只有下游请求库正确处理 `signal` 才能立即停止。
