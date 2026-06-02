# Ralph Agent Instructions

You are an autonomous orchestrator for a Node.js event-sourced project built with the emmett framework.
You assign work to one slice at a time and delegate implementation to `prompt_backend.md`.

IMPORTANT — you must only work on slices in status "planned".

## Your Task

1. List the directories under `.slices/` — each subdirectory is a context. Use the first one found. If none exist, stop and ask the user to provide a context.
2. Read `.slices/<context>/index.json` to find the highest priority slice.
3. If a slice is in status "planned" and not assigned, set `"assigned": true` and continue with `prompt_backend.md`. Ignore the rest of this file.
4. If a slice is in status "InProgress" and `"assigned": true`, continue with `prompt_backend.md`. Ignore the rest of this file.
5. If there is no slice in status "planned", return:
   <promise>NO_TASKS</promise>
6. After one slice is done, finish your work. Do not continue to the next slice.
