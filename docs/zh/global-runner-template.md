# 全局 Runner 最佳实践模板（React）

这份模板目标：
- 在项目入口配置一次 `createRunner`
- 全项目统一用 `runTask`（单任务 + 并发都走它）
- 让 `setMeta/getMeta/onState/getState` 的用途清晰可复制

> 说明：代码里的 `account/password/token` 等是业务示例字段，不是 mangoo 内置字段。

---

## 1. 在项目入口创建全局 Runner

```ts
// src/app/mangoo.ts
import { createRunner } from "mangoo";

// 全局统一默认并发策略（仅影响 runTask 的数组模式）
export const appRunner = createRunner({
  concurrency: 4,
  mode: "fail-fast"
});
```

---

## 2. 封装业务任务（串行主流程 + 并发子流程）

```ts
// src/features/auth/auth-task.ts
import { appRunner } from "@/app/mangoo";

type LoginInput = {
  account: string; // 业务字段
  password: string; // 业务字段
};

type TaskMeta = {
  phase: "init" | "qr" | "login" | "token" | "home-parallel" | "done"; // 业务自定义阶段
  qrUrl?: string; // 业务自定义字段
};

type HomeData = {
  banners: Array<{ id: string; imageUrl: string }>;
  notices: Array<{ id: string; title: string }>;
  products: Array<{ id: string; name: string }>;
  vip: { level: string };
};

// 这些 API 仅示例签名，请替换为你的真实 API
declare function getLoginQrCode(signal?: AbortSignal): Promise<{ qrId: string; qrUrl: string }>;
declare function loginByPassword(input: LoginInput, qrId: string, signal?: AbortSignal): Promise<{ sessionId: string }>;
declare function getToken(sessionId: string, signal?: AbortSignal): Promise<{ accessToken: string }>;
declare function fetchBannerList(token: string, signal?: AbortSignal): Promise<HomeData["banners"]>;
declare function fetchNoticeList(token: string, signal?: AbortSignal): Promise<HomeData["notices"]>;
declare function fetchProductList(token: string, signal?: AbortSignal): Promise<HomeData["products"]>;
declare function fetchVipInfo(token: string, signal?: AbortSignal): Promise<HomeData["vip"]>;

export function createLoginTask(input: LoginInput) {
  // 函数模式：返回 TaskHandleSimple（有 id/result/cancel/onState/getState）
  return appRunner.runTask<LoginInput, { token: string; homeData: HomeData }, TaskMeta>(
    async ({ params, signal, setMeta, getMeta }) => {
      // params: 本次执行输入（来自 config.params）
      // signal: 取消信号，需要透传到请求层

      // 1) 获取二维码
      setMeta({ phase: "qr" });
      const qr = await getLoginQrCode(signal);
      setMeta({ qrUrl: qr.qrUrl });

      // getMeta: 读取当前 meta 快照（例如调试或拼装日志）
      const snapshotAfterQr = getMeta();
      console.log("当前二维码：", snapshotAfterQr.qrUrl);

      // 2) 登录
      setMeta({ phase: "login" });
      const loginRes = await loginByPassword(params, qr.qrId, signal);

      // 3) 取 token
      setMeta({ phase: "token" });
      const tokenRes = await getToken(loginRes.sessionId, signal);

      // 4) 首页并发加载（数组模式，仍然是 runTask）
      setMeta({ phase: "home-parallel" });
      const [banners, notices, products, vip] = await appRunner.runTask(
        [
          // index=0
          ({ signal }) => fetchBannerList(tokenRes.accessToken, signal),
          // index=1
          ({ signal }) => fetchNoticeList(tokenRes.accessToken, signal),
          // index=2
          ({ signal }) => fetchProductList(tokenRes.accessToken, signal),
          // index=3
          ({ signal }) => fetchVipInfo(tokenRes.accessToken, signal)
        ],
        undefined,
        {
          // 可选：覆盖全局 runner 默认值
          concurrency: 2,
          mode: "fail-fast",
          signal
        }
      );

      const homeData: HomeData = { banners, notices, products, vip };

      // 5) 结束
      setMeta({ phase: "done" });
      return { token: tokenRes.accessToken, homeData };
    },
    {
      params: input,
      meta: { phase: "init" }
    }
  );
}
```

---

## 3. 在页面里消费任务句柄（onState/getState/cancel/result）

```tsx
// src/features/auth/LoginPage.tsx
import { useEffect, useRef, useState } from "react";
import { createLoginTask } from "./auth-task";

export default function LoginPage() {
  const [statusText, setStatusText] = useState("idle");
  const taskRef = useRef<ReturnType<typeof createLoginTask> | null>(null);

  const onSubmit = () => {
    const task = createLoginTask({ account: "demo", password: "123456" });
    taskRef.current = task;

    // getState: 同步读取一次当前状态快照（通常用于调试或埋点）
    const initialSnapshot = task.getState();
    console.log("提交后立即快照：", initialSnapshot.status, initialSnapshot.meta);

    // onState: 订阅状态变化（注册后会立即收到一次当前状态）
    const off = task.onState((state) => {
      // onState 是被动订阅；会随着状态变化持续触发
      setStatusText(`${state.status} / phase=${String(state.meta.phase)}`);
    });

    // result: 任务结束后的统一结果
    void task.result.then((res) => {
      off(); // 结束后取消订阅
      if (res.status === "success") {
        console.log("登录完成", res.data);
      } else if (res.status === "error") {
        console.error("任务失败", res.error);
      }
    });
  };

  const onCancel = () => {
    // cancel: 主动取消任务
    taskRef.current?.cancel("manual_cancel");
  };

  useEffect(() => {
    return () => {
      // 页面卸载时兜底取消
      taskRef.current?.cancel("component_unmounted");
    };
  }, []);

  return (
    <div>
      <button onClick={onSubmit}>登录并初始化首页</button>
      <button onClick={onCancel}>取消任务</button>
      <p>{statusText}</p>
    </div>
  );
}
```

---

## 4. `setMeta/getMeta/onState/getState` 一句话速查

- `setMeta(patch)`：任务内部更新过程状态（如 `phase`、进度、临时信息）。
- `getMeta()`：任务内部同步读取当前 `meta` 快照。
- `onState(listener)`：外部订阅任务状态变化，返回取消订阅函数。
- `getState()`：外部在任意时刻同步读取当前状态快照。

---

## 5. 最小使用约束（避免混淆）

- mangoo 固定字段：`params/signal/setMeta/getMeta/status/loading/data/error/meta`。
- 业务字段（如 `token/qrUrl/account`）由你自己定义。
- 只要是请求函数，尽量都接收并透传 `signal`。
