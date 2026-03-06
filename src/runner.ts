import { runTasks as runTasksBase } from "./parallel";
import { runTask as runTaskBase } from "./task";
import type {
  ParallelRunOptions,
  ParallelTask,
  RunnerOptions,
  TaskFn,
  TaskRunConfig,
  TaskHandleSimple,
} from "./types";

export interface Runner {
  runTask: {
    <I = unknown, O = unknown, M extends Record<string, unknown> = Record<string, unknown>>(
      taskFn: TaskFn<I, O, M>,
      config?: TaskRunConfig<I, M>
    ): TaskHandleSimple<O, M>;
    <I = unknown, O = unknown>(
      tasks: Array<ParallelTask<I, O>>,
      params?: I,
      options?: ParallelRunOptions
    ): Promise<O[]>;
  };
}

const defaultOptions: Required<Pick<RunnerOptions, "concurrency" | "mode">> = {
  concurrency: 8,
  mode: "fail-fast"
};

export function createRunner(options: RunnerOptions = {}): Runner {
  const merged = {
    concurrency: options.concurrency ?? defaultOptions.concurrency,
    mode: options.mode ?? defaultOptions.mode
  };

  function runTask<I = unknown, O = unknown, M extends Record<string, unknown> = Record<string, unknown>>(
    taskFn: TaskFn<I, O, M>,
    config?: TaskRunConfig<I, M>
  ): TaskHandleSimple<O, M>;
  function runTask<I = unknown, O = unknown>(
    tasks: Array<ParallelTask<I, O>>,
    params?: I,
    options?: ParallelRunOptions
  ): Promise<O[]>;
  function runTask<I = unknown, O = unknown, M extends Record<string, unknown> = Record<string, unknown>>(
    taskOrTasks: TaskFn<I, O, M> | Array<ParallelTask<I, O>>,
    configOrParams?: TaskRunConfig<I, M> | I,
    options?: ParallelRunOptions
  ): TaskHandleSimple<O, M> | Promise<O[]> {
    if (Array.isArray(taskOrTasks)) {
      return runTasksBase(taskOrTasks, configOrParams as I, {
        concurrency: options?.concurrency ?? merged.concurrency,
        mode: options?.mode ?? merged.mode,
        signal: options?.signal
      });
    }
    return runTaskBase(taskOrTasks, configOrParams as TaskRunConfig<I, M>);
  }

  return {
    runTask
  };
}

const defaultRunner = createRunner();

export const runTask = defaultRunner.runTask;
