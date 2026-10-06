# Development notes

This document covers repository-specific extension points that are useful when adding workflow functionality.

## Add a workflow task

A workflow task has both an editor definition and a runtime executor.

When adding a new task type:

1. Add the task identifier to `TaskType` in `types/task.ts`.
2. Create the task definition under `lib/workflow/task/`.
3. Register the task in `lib/workflow/task/registry.tsx`.
4. Expose the task in `app/workflow/_components/task-menu.tsx`.
5. Create the runtime executor under `lib/workflow/executor/`.
6. Register the executor in `lib/workflow/executor/registry.ts`.
7. Add focused tests for validation, planning, and executor behavior where applicable.

The task definition is responsible for editor-facing metadata, inputs, outputs, and credit metadata. The executor is responsible for runtime behavior.

## Add a task parameter type

When a task requires a new parameter UI/type:

1. Add the parameter identifier to `TaskParamType` in `types/task.ts`.
2. Create the parameter component under `app/workflow/_components/nodes/param/`.
3. Add it to the switch in `app/workflow/_components/nodes/node-param-field.tsx`.
4. Add an appropriate handle mapping in `app/workflow/_components/nodes/common.tsx` when the parameter participates in graph connections.

## Verify changes

Run the same application checks used by CI:

```bash
npm ci
npm test -- --runInBand
npm run lint
npm run build
```

For changes that affect queue or browser execution, also run the Compose smoke path:

```bash
cp .env.example .env
# For the controlled public smoke fixture only:
# set SCRAPE_ROBOTS_MODE=advisory in .env

docker compose up --build -d
docker compose exec -T worker npx tsx scripts/compose-worker-smoke.ts
```

## Queue enqueue benchmark

With Redis available, run:

```bash
npm run benchmark:queue
```

Optional arguments set producer concurrency and total jobs:

```bash
npm run benchmark:queue -- 50 5000
```

The benchmark uses an isolated BullMQ queue and removes its waiting jobs when finished. It measures **enqueue throughput only**; it is not a browser/workflow capacity test.

## Secrets

Never commit a populated `.env` or print secrets/partial secrets in diagnostics. Use `.env.example` for names and non-secret placeholders.
