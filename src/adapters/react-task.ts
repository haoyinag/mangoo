import { useCallback, useEffect, useRef, useState } from "react";
import { createRunner } from "../runner";
import type {
  ParallelTask,
  RunnerOptions,
  TaskFn,
  TaskHandleSimple,
  TaskResult,
  TaskRunOptions
} from "../types";

export interface ReactUseAsyncTaskState<I = unknown, O = unknown, M extends Record<string, unknown> = Record<string, unknown>> {
  taskId: string | null;
  status: "idle" | "running" | "success" | "error" | "aborted";
  loading: boolean;
  data: O | undefined;
  error: import("../errors").AsyncTaskError | null;
  meta: M;
  run: (params?: I, options?: TaskRunOptions) => Promise<TaskResult<O, M>>;
  execute: (params?: I, options?: TaskRunOptions) => Promise<TaskResult<O, M>>;
  cancel: (reason?: string) => void;
  reset: () => void;
}

export function useTask<I = unknown, O = unknown, M extends Record<string, unknown> = Record<string, unknown>>(
  taskFn: TaskFn<I, O, M>,
  options?: RunnerOptions,
  initialMeta?: M
): ReactUseAsyncTaskState<I, O, M>;
export function useTask<I = unknown, O = unknown, M extends Record<string, unknown> = Record<string, unknown>>(
  tasks: Array<ParallelTask<I, O>>,
  options?: RunnerOptions,
  initialMeta?: M
): ReactUseAsyncTaskState<I, O[], M>;
export function useTask<I = unknown, O = unknown, M extends Record<string, unknown> = Record<string, unknown>>(
  taskInput: TaskFn<I, O, M> | Array<ParallelTask<I, O>>,
  options: RunnerOptions = {},
  initialMeta?: M
): ReactUseAsyncTaskState<I, O | O[], M> {
  const runner = useRef(createRunner(options)).current;

  const currentTaskRef = useRef<TaskHandleSimple<O | O[], M> | null>(null);
  const offStateRef = useRef<(() => void) | null>(null);

  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error" | "aborted">("idle");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<O | O[] | undefined>(undefined);
  const [error, setError] = useState<import("../errors").AsyncTaskError | null>(null);
  const [meta, setMeta] = useState<M>(initialMeta ?? ({} as M));

  const clearSubscription = useCallback(() => {
    if (offStateRef.current) {
      offStateRef.current();
      offStateRef.current = null;
    }
  }, []);

  const run = useCallback(
    async (params?: I, runOptions?: TaskRunOptions) => {
      currentTaskRef.current?.cancel("replaced_by_new_run");
      clearSubscription();

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

      currentTaskRef.current = task;
      setTaskId(task.id);

      offStateRef.current = task.onState((s) => {
        setStatus(s.status);
        setLoading(s.loading);
        setData(s.data);
        setError(s.error);
        setMeta(s.meta);
      });

      return task.result;
    },
    [clearSubscription, initialMeta, runner, taskInput]
  );

  const cancel = useCallback((reason?: string) => {
    currentTaskRef.current?.cancel(reason);
  }, []);

  const reset = useCallback(() => {
    currentTaskRef.current?.cancel("manual_reset");
    clearSubscription();
    currentTaskRef.current = null;
    setTaskId(null);
    setStatus("idle");
    setLoading(false);
    setData(undefined);
    setError(null);
    setMeta(initialMeta ?? ({} as M));
  }, [clearSubscription, initialMeta]);

  useEffect(() => {
    return () => {
      currentTaskRef.current?.cancel("component_unmounted");
      clearSubscription();
      currentTaskRef.current = null;
    };
  }, [clearSubscription]);

  return {
    taskId,
    status,
    loading,
    data,
    error,
    meta,
    run,
    execute: run,
    cancel,
    reset
  };
}

export { useTask as useAsyncTask };
