# Agent Learnings

Patterns and gotchas discovered during task processing. Update this file whenever you encounter something reusable.

## tasks.json

- Tasks are objects with `id`, `createdAt`, and `payload` (a `SliceChangedPayload`).
- After completing a task, remove it from the array entirely — do not add a status field.
- Write `[]` to `tasks.json` if the last task is completed.

## SliceChangedPayload fields

```
event           always "slice:changed"
organizationId  org UUID or null
boardId         board UUID
sliceId         SLICE_BORDER node UUID — use this with /load-slice
sliceTitle      human-readable slice name (may be null)
sliceStatus     e.g. "Created", "InProgress", "Done", "Blocked" (may be null)
timestamp       unix ms when the change was emitted
```

## Slice files

The realtime agent writes `slices/<sliceId>.json` for every slice on startup and after each `slice:changed` event. These files are always up to date — read them directly before invoking any skill.

## Skill Usage

- Always run `/connect` first to load credentials from `.eventmodelers/config.json` before calling any other skill.
- `/load-slice sliceId=<uuid>` re-fetches all slices from the API, refreshes `slices/*.json`, and returns the requested slice. Use it when you need a guaranteed-fresh view of a specific slice.
- Read `slices/<sliceId>.json` directly when you already know the ID and the file is recent enough.

## Board API

- The `boardId` and `organizationId` from each payload provide full context — pass them to skills.
- Node events use `node:created`, `node:changed`, `node:deleted` — always POST to `/api/org/:orgId/boards/:boardId/nodes/events`.
- Slice metadata (title, status) lives on the SLICE_BORDER node under `meta.sliceStatus` and `meta.title`.

## Emmett Framework — Library Management Project

### Project Structure
- Context folder name maps to camelCase TypeScript folder: "Library Management" → `libraryManagement`
- Events union lives in `src/slices/{contextPackage}/{Context}Events.ts`
- Routes and processors are auto-discovered via glob in `server.ts` — no manual registration needed
- Flyway migrations live in `migrations/` (not `supabase/migrations/`)

### Command Handler (STATE_CHANGE / AUTOMATION)
- Throw `{code: 'snake_case_code', message: '...'}` for business rule violations
- `findEventstore()` is a singleton from `src/common/loadPostgresEventstore.ts`
- No auth middleware exists — skip auth in routes
- `DeciderSpecification.then()` uses `isSubset` matching — `metadata: {}` works in test assertions even if actual has extra keys
- For automation slices: stream ID is typically the domain key field (e.g., isbn when no separate id field exists)

### Automation Slice (PROCESSOR)
- Processor trigger comes from events, even when slice.json shows a READMODEL as INBOUND — trace back to which event populates the readmodel
- `processorInstanceId: v4()` generates a new UUID each restart for competing-consumer safety
- PROCESSOR_ID must be unique across all processors; use format `{slicename}-automation`
- Automation slices do NOT get a `routes.ts` — commands are fired internally by the processor
- Wrap `eachMessage` in try/catch and call `storeDlqMessage` on failure
- Processors are auto-started by `server.ts` — just export `processor = { start, stop }`

### Projection (STATE_VIEW)
- `postgreSQLRawSQLProjection` evolve returns `SQL[]` built via knex `.toQuery()` wrapped in `sql()`
- Always create a new knex instance per evolve call with `pool: { min: 0, max: 1 }` and destroy in finally
- New projections must be added to `projections.inline([...])` in `src/common/loadPostgresEventstore.ts`
- `schema.migrate()` is already called in `findEventstore()` — no need to add it again
