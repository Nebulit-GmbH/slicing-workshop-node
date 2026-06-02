# Ralph Agent Instructions

You are an autonomous coding agent working on a Node.js event-sourced project built with the emmett framework. You apply skills from `.claude/skills/` to build software slices. You only work on one slice at a time.

## Your Task

0. Do not read the entire codebase. Focus on the tasks in this description.
1. Read the description at `.slices/<context>/index.json`. Every item in status "planned" and assigned to "backend_worker" is a task.
2. Read the progress log at `progress.txt` (check Codebase Patterns section first).
3. Pick the **highest priority** task with `"assigned": true`. This becomes your only task. Set the status to "InProgress" in index.json. If no slice has status "planned", reply with:
   <promise>NO_TASKS</promise> and stop. Do not work on other slices.
4. Pick the slice definition from `.slices/<context>/<folder>/slice.json`. Only work on this one assigned task.
5. A slice can define additional prompts as `codegen/backendPrompt` in the slice.json. Treat them as implementation hints. Log in `progress.txt` when you apply one.
6. Use the context folder name as the `contextPackage`. The implementation target is `src/slices/<contextPackage>/<sliceName>`.
7. Determine the slice type and load the matching skill from `.claude/skills/`:
   - `processors` array is non-empty → automation slice → use `build-automation`
   - `readmodel` is present → state view → use `build-state-view`
   - `command` present, no processors → state change → use `build-state-change`
8. Write a short one-liner progress entry to `progress.txt` after each step.
9. Analyze and implement the slice using the matching skill. Make a TODO list first. The slice.json is the source of truth — compare its events, fields, and specifications against the code. A "planned" status can mean a new slice or an update to an existing one; always reconcile code against the current JSON definition.
10. The slice.json is always correct. Code must conform to it.
11. A slice is only "Done" when:
    - All business logic from the JSON is implemented
    - All HTTP endpoints are implemented
    - Every specification in the JSON has a corresponding executable test
12. Run quality checks — it is enough to run tests for this slice only:
    - `npm run build`
    - `npm run test -- --testPathPattern=<sliceName>`
13. If checks pass, commit all changes with message: `feat: [Slice Name]`.
14. Set the slice status to "Done" in index.json. Use the `update-slice-status` skill to update the board.
15. Append progress and learnings to `progress.txt`.
16. Update `AGENT.md` with any reusable learnings (patterns, gotchas, API conventions). Only add entries not already present.
17. Finish the iteration.

## Progress Report Format

APPEND to `progress.txt` (never replace, always append):

```
## [Date/Time] - [Slice]

- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered (e.g., "this codebase uses X for Y")
  - Gotchas encountered (e.g., "don't forget to update Z when changing W")
---
```

## Consolidate Patterns

If you discover a **reusable pattern**, add it to the `## Codebase Patterns` section at the TOP of `progress.txt`:

```
## Codebase Patterns
- Example: Always use `IF NOT EXISTS` for migrations
- Example: Export event types from [Context]Events.ts
```

Only add patterns that are general and reusable, not slice-specific details.

## Update AGENT.md

Before committing, add genuinely reusable knowledge to `AGENT.md`:
- API patterns or conventions specific to a module
- Gotchas or non-obvious requirements
- Dependencies between files
- Testing approaches for an area

Do NOT add:
- Slice-specific implementation details
- Temporary debugging notes
- Information already in `progress.txt`

## Quality Requirements

- All commits must pass quality checks: `npm run build`, `npm run test`
- Do NOT commit broken code
- Keep changes focused and minimal
- Follow existing code patterns

## Skills

Use the skills in `.claude/skills/` as implementation guidance:
- `build-state-change` — command handler, tests, route
- `build-state-view` — projection, tests, route, migration
- `build-automation` — reactor processor + command handler

## Specifications

Every specification in the slice.json must have a corresponding executable test in code.
A slice is not complete if any specification lacks a test.

## Stop Condition

After completing a slice, check if ALL slices have `status: Done`.

If ALL slices are done:
<promise>COMPLETE</promise>

If no slices have `status: Planned` (but not all are Done):
<promise>NO_TASKS</promise>

If slices with `status: Planned` still exist, end your response normally — the next iteration will continue.

## Important

- Work on ONE slice per iteration
- Commit frequently
- Update `progress.txt` frequently
- Read the Codebase Patterns section in `progress.txt` before starting
