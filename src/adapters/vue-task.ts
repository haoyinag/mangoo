import { onUnmounted, ref, shallowRef } from "vue";
import { createRunner } from "../runner";
import type {
  ParallelTask,
  RunnerOptions,
  TaskFn,
  TaskHandleSimple,
  TaskResult,
  TaskRunOptions
} from "../types";
import type { Ref, ShallowRef } from "vue";

export interface VueUseAsyncTaskState<I = unknown, O = unknown, M extends Record<string, unknown> = Record<string, unknown>> {
  taskId: Ref<string | null>;
  status: Ref<"idle" | "running" | "success" | "error" | "aborted">;
  loading: Ref<boolean>;
  data: ShallowRef<O | undefined>;
  error: ShallowRef<import("../errors").AsyncTaskError | null>;
  meta: Ref<M>;
  run: (params?: I, options?: TaskRunOptions) => Promise<TaskResult<O, M>>;
  execute: (params?: I, options?: TaskRunOptions) => Promise<TaskResult<O, M>>;
  cancel: (reason?: string) => void;
  reset: () => void;
}

export function useTask<I = unknown, O = unknown, M extends Record<string, unknown> = Record<string, unknown>>(
  taskFn: TaskFn<I, O, M>,
  options?: RunnerOptions,
  initialMeta?: M
): VueUseAsyncTaskState<I, O, M>;
export function useTask<I = unknown, O = unknown, M extends Record<string, unknown> = Record<string, unknown>>(
  tasks: Array<ParallelTask<I, O>>,
  options?: RunnerOptions,
  initialMeta?: M
): VueUseAsyncTaskState<I, O[], M>;
export function useTask<I = unknown, O = unknown, M extends Record<string, unknown> = Record<string, unknown>>(
  taskInput: TaskFn<I, O, M> | Array<ParallelTask<I, O>>,
  options: RunnerOptions = {},
  initialMeta?: M
): VueUseAsyncTaskState<I, O | O[], M> {
  const runner = createRunner(options);

  const taskId = ref<string | null>(null);
  const status = ref<"idle" | "running" | "success" | "error" | "aborted">("idle");
  const loading = ref(false);
  const data = shallowRef<O | O[] | undefined>(undefined);
  const error = shallowRef<import("../errors").AsyncTaskError | null>(null);
  const meta = ref<M>(initialMeta ?? ({} as M)) as Ref<M>;

  let currentTask: TaskHandleSimple<O | O[], M> | null = null;
  let offState: (() => void) | null = null;

  const clearSubscription = () => {
    if (offState) {
      offState();
      offState = null;
    }
  };

  const run = async (params?: I, runOptions?: TaskRunOptions) => {
    if (currentTask) {
      currentTask.cancel("replaced_by_new_run");
      clearSubscription();
    }

    const task = runner.runTask(
      async ({ params: localParams, signal, setMeta, getMeta }) => {
        if (Array.isArray(taskInput)) {
          return runner.runTask(taskInput, localParams, {
            signal,
            concurrency: runOptions?.concurrency,
            mode: runOptions?.mode
          });
        }

        return taskInput({
          params: localParams,
          signal,
          setMeta,
          getMeta
        });
      },
      {
        params,
        signal: runOptions?.signal,
        meta: initialMeta
      }
    );

    currentTask = task;
    taskId.value = task.id;

    offState = task.onState((s) => {
      status.value = s.status;
      loading.value = s.loading;
      data.value = s.data;
      error.value = s.error;
      meta.value = s.meta;
    });

    return task.result;
  };

  const cancel = (reason?: string) => {
    currentTask?.cancel(reason);
  };

  const reset = () => {
    currentTask?.cancel("manual_reset");
    clearSubscription();
    currentTask = null;
    taskId.value = null;
    status.value = "idle";
    loading.value = false;
    data.value = undefined;
    error.value = null;
    meta.value = initialMeta ?? ({} as M);
  };

  onUnmounted(() => {
    currentTask?.cancel("component_unmounted");
    clearSubscription();
    currentTask = null;
  });

  return {
    taskId,
    status,
    loading,
    data,
    error,
    meta: meta as Ref<M>,
    run,
    execute: run,
    cancel,
    reset
  };
}

export { useTask as useAsyncTask };
