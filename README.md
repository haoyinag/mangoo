# mangoo

`mangoo` is a native-first async guardrail library.

## Current Status
- Baseline: `v0.1` (locked)
- Working track: `v0.2-draft` (P0+P1 applied)

## Primary API (current draft)
- `runTask`
- `runParallel`
- `createRunner`
- `useTask` from `mangoo/react`
- `useTask` from `mangoo/vue`

## Principles
1. Keep business logic in native `async/await`
2. Add guardrails for state/cancel/concurrency/error
3. Keep core framework-agnostic
4. Keep core HTTP-client-agnostic

## Official Docs
- Site source: [`docs/`](./docs)
- Legacy markdown set: [`official/`](./official)

## Usage Guides
- [official/USAGE_REACT.md](./official/USAGE_REACT.md)
- [official/USAGE_VUE.md](./official/USAGE_VUE.md)

## Commands
```bash
npm install mangoo
npm test
npm run build
npm run docs:dev
npm run docs:build
```

## Docs Deployment
- GitHub Actions workflow: [`.github/workflows/docs.yml`](./.github/workflows/docs.yml)
- Default Pages base path uses repository name via `DOCS_BASE`.
