# Core Concepts

## One API, two modes

`runTask` supports two input shapes:

- function input: returns `TaskHandleSimple` (stateful task)
- array input: returns `Promise<O[]>` (parallel execution)

## Task state model

Function mode provides:
- `status`: `idle | running | success | error | aborted`
- `loading`
- `data`
- `error`
- `meta`
- `startedAt` / `endedAt`

## Cancellation model

Cancellation is cooperative via `AbortSignal`.

- `cancel()` aborts internal controller
- your async layer must consume `signal` to stop work immediately

## Parallel model

Array mode supports:
- `concurrency` (positive integer)
- `mode`: `fail-fast | collect-all`

`fail-fast` rejects on first failure.
`collect-all` waits all and rejects with `AggregateError` when any fail.

## Runner defaults

`createRunner({ concurrency, mode })` sets default options for array mode of `runTask`.
