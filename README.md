# Slicing Workshop — Node.js

An event-sourced Node.js project built with the [Emmett](https://github.com/event-driven-io/emmett) framework. Slices are designed in [EventModelers](https://eventmodelers.io) and implemented autonomously by the **Ralph** AI agent loop.

---

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- [Flyway CLI](https://flywaydb.org/documentation/usage/commandline/) (for migrations)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) (`claude`) — required by the agent loop

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials. The defaults work with the included Docker Compose setup:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
PORT=3000
API_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000
FLYWAY_URL=jdbc:postgresql://localhost:5432/postgres
FLYWAY_USER=postgres
FLYWAY_PASSWORD=password
```

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Run database migrations

```bash
npm run flyway:migrate
```

---

## Running the project

**Development mode** (with ts-node, auto-reloads on change):

```bash
npm run dev
```

**Production mode** (run compiled output):

```bash
npm run build
npm start
```

The server starts on `http://localhost:3000`. Swagger UI is available at `http://localhost:3000/api-docs`.

---

## Testing

```bash
npm test
```

Run tests for a specific slice only:

```bash
npm test -- --testPathPattern=<sliceName>
```

Example:

```bash
npm test -- --testPathPattern=CatalogEntries
```

---

## Project Structure

```
src/
├── common/                  # Shared utilities (eventstore, DB helpers, test helpers)
├── slices/
│   └── libraryManagement/   # One folder per bounded context (camelCase of context name)
│       ├── <SliceName>/
│       │   ├── CommandHandler.ts       # State-change slice (decider + command logic)
│       │   ├── <SliceName>Projection.ts # State-view slice (read model projection)
│       │   ├── routes.ts               # Express route handlers (auto-discovered)
│       │   └── *.test.ts               # Slice-level tests
│       └── LibraryManagementEvents.ts  # Union type of all domain events
├── example/                 # Reference slice
└── swagger.ts               # Swagger/OpenAPI setup
migrations/                  # Flyway SQL migrations (V1__, V2__, ...)
.slices/                     # Slice definitions exported from EventModelers
└── Library Management/
    ├── index.json           # Slice list with status and priority
    └── <slicefolder>/
        └── slice.json       # Full slice definition (events, commands, specs)
```

Routes are **auto-discovered** — any file matching `dist/src/slices/**/routes*.js` is mounted automatically by `server.ts`.

---

## Slice Types

| Type | Triggered by | Key files |
|---|---|---|
| **State Change** | HTTP command | `CommandHandler.ts`, `routes.ts` |
| **State View** | Events → read model | `*Projection.ts`, `routes.ts`, migration |
| **Automation** | Events → internal command | `CommandHandler.ts`, processor (no routes) |

---

## Ralph — Autonomous Agent Loop

**Ralph** is a shell-based AI agent loop that reads slice definitions from `.slices/` and implements them one at a time using Claude Code.

### How it works

1. Reads `.slices/<context>/index.json` and picks the highest-priority slice with `status: planned`.
2. Sets `"assigned": true` and delegates implementation to `prompt_backend.md`.
3. The backend agent picks the correct skill (`build-state-change`, `build-state-view`, or `build-automation`), implements the slice, runs tests, commits, and marks the slice `Done`.
4. Ralph loops until all slices are done or the iteration limit is reached.

### Running Ralph

```bash
./ralph.sh            # default: 10 iterations
./ralph.sh 20         # custom max iterations
```

Ralph automatically retries on transient Claude errors and waits when the spending limit is reached.

**Stop signals emitted by the agent:**

| Signal | Meaning |
|---|---|
| `<promise>COMPLETE</promise>` | All slices are done |
| `<promise>NO_TASKS</promise>` | No planned slices found — loop pauses 30 s |

Progress is logged to `progress.txt`.

---

## Exercises

### Exercise 1 — Let Ralph build a slice autonomously

This exercise walks you through the full Ralph workflow: setting a slice to planned, starting the agent loop, and reviewing what was built.

**Step 1 — Mark a slice as planned**

Open `.slices/Library Management/index.json` and find the `"Create Catalog Entry"` slice. Change its `"status"` field to `"planned"`:

```json
{
  "title": "Create Catalog Entry",
  "status": "planned",
  ...
}
```

Saving the file is all that's needed — Ralph reads this file on every iteration.

**Step 2 — Start Ralph**

On macOS/Linux with bash:

```bash
./ralph.sh
```

On Windows (WSL or Git Bash):

```bash
bash ralph.sh
```

Alternatively, run the Node.js version directly (no bash required):

```bash
node ralph.js
```

Ralph will detect the planned slice, delegate it to Claude Code, and log progress to `progress.txt`.

**Step 3 — Watch the agent build**

You can tail the progress log while Ralph runs:

```bash
tail -f progress.txt
```

Ralph sets the slice to `"assigned": true` while it's being worked on, then marks it `"Done"` when tests pass.

**Step 4 — Review the generated code**

Once Ralph completes, inspect the slice output under `src/slices/libraryManagement/`:

```
src/slices/libraryManagement/
└── CreateCatalogEntry/
    ├── CommandHandler.ts       # Business logic and decider
    ├── CommandHandler.test.ts  # Spec-driven unit tests
    └── routes.ts               # Express route wiring
```

Run the tests to confirm everything passes:

```bash
npm test -- --testPathPattern=CreateCatalogEntry
```

Open Swagger UI at `http://localhost:3000/api-docs` to try the new endpoint live.

### Exercise 2 — Add a read model (state-view slice)

Repeat the same workflow for the `"Catalog Entries"` slice, which builds a projection (read model) instead of a command handler.

**Step 1 — Mark the slice as planned**

In `.slices/Library Management/index.json`, set `"Catalog Entries"` to `"planned"`:

```json
{
  "title": "Catalog Entries",
  "status": "planned",
  ...
}
```

**Step 2 — Start Ralph** (same as before)

```bash
./ralph.sh
# or
node ralph.js
```

**Step 3 — Review the generated code**

This time Ralph will build a state-view slice:

```
src/slices/libraryManagement/
└── CatalogEntries/
    ├── CatalogEntriesProjection.ts       # Event → read model projection
    ├── CatalogEntriesProjection.test.ts  # Projection tests
    └── routes.ts                          # GET endpoint for the read model
```

A new Flyway migration will also appear in `migrations/` to create the projection table.

Run the tests:

```bash
npm test -- --testPathPattern=CatalogEntries
```

Then call the endpoint to see the read model populated from the events written in Exercise 1.

### Exercise 3 — Update a slice after a design change

A new event (`Catalogue Entry Removed`) has been added to the EventModelers board, and two new BDD specifications were added to the `"Catalog Entries"` slice. In this exercise you merge the updated slice definition and let Ralph implement the changes.

**Step 1 — Merge the updated branch**

The updated slice definition lives on the `exercise-3` branch. Merge it into your working branch:

```bash
git merge exercise-3
```

This brings in the updated `.slices/Library Management/CatalogEntries/slice.json` with the new event and specs. Inspect the diff to see what changed:

```bash
git diff HEAD~1 .slices/
```

**Step 2 — Reset the slice status to planned**

Ralph only picks up slices with `"status": "planned"`. Open `.slices/Library Management/index.json` and reset `"Catalog Entries"` back to planned:

```json
{
  "title": "Catalog Entries",
  "status": "planned",
  ...
}
```

**Step 3 — Run Ralph**

```bash
./ralph.sh
# or
node ralph.js
```

Ralph will reconcile the existing `CatalogEntriesProjection.ts` against the updated slice definition — it handles the `Catalogue Entry Removed` event and the two new specs without overwriting tests.

**Step 4 — Review the changes**

Once Ralph marks the slice `Done`, review what changed:

```bash
git diff HEAD~1 src/slices/libraryManagement/CatalogEntries/
```

Run the full test suite for the slice to confirm all specs pass — including the two new ones:

```bash
npm test -- --testPathPattern=CatalogEntries
```

---

## Adding a new slice

1. Design the slice in EventModelers and export the board config.
2. Save the slice definition to `.slices/<Context>/<slicefolder>/slice.json`.
3. Add the entry to `.slices/<Context>/index.json` with `"status": "planned"`.
4. Run Ralph — it will pick it up automatically.

Or implement manually by invoking a skill directly in Claude Code:

```
/build-state-change
/build-state-view
/build-automation
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/postgres` |
| `PORT` | HTTP server port | `3000` |
| `API_URL` | Public API base URL | `http://localhost:3000` |
| `BACKEND_URL` | Backend base URL (used internally) | `http://localhost:3000` |
| `FLYWAY_URL` | JDBC URL for Flyway migrations | `jdbc:postgresql://localhost:5432/postgres` |
| `FLYWAY_USER` | Database user for migrations | `postgres` |
| `FLYWAY_PASSWORD` | Database password for migrations | `password` |
| `TESTING` | Set to `true` to enable test mode | `false` |
