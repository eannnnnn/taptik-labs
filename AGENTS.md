## Workflow Orchestration

### 0. Required Startup Flow
- At the start of a session that includes non-trivial development work (3+ steps, cross-file changes, or architectural decisions), run `/memories init`, then `/canon init`, and read the returned notes before touching workspace code.
- Do not re-run this bootstrap for every later request in the same session. Refresh it only when the user explicitly asks for updated memory or canon context.
- Keep `memories` and `canon` reads and writes sequential. Do not parallelize those flows.
- If either skill or its helper layer cannot provide the required context, stop and report the failure instead of silently working around it.
- `memories` stores lessons and reusable rules. `canon` stores active feature scope, task state, ownership, and status history.

### 1. Execution Discipline
- Maintain an explicit plan or checklist for any non-trivial task.
- If something goes sideways, reload the relevant memory or canon context and then re-plan.
- Verify the changed surface area and confirm the relevant checks passed before declaring work done.

### 2. Memory Rules
- Use `memories` as the only interface for memory load, save, and management.
- Do not read or write memory DB files or lesson files directly unless migration or recovery explicitly requires it.
- Use property-first retrieval (`project`, `status`) before broader `tag:#memories` scope, and read full notes only when they are relevant to the current task.
- In project context, retrieval order is always project first, then global.
- If the user says phrases like `기억해`, `외워둬`, `메모리에 저장`, or `저장해`, treat that as a memory write command.
- Global save commands map to global scope. Project save commands map to project scope. If unspecified, default to project scope.
- After any correction from the user, save a lesson through `memories` one note at a time while preserving `name`, `project`, `tags`, and `status`.

### 3. Canon Rules
- Treat `canon/<project>/<domain>/<feature>.md` as an Obsidian-managed note path, never a workspace path.
- Never use workspace `Read`, `Write`, `Edit`, `apply_patch`, directory creation, or ad hoc local files as substitutes for canon note operations.
- If Obsidian or canon helper scripts are unavailable, stop and report the failure. Do not fall back to local filesystem edits for canon notes.
- Re-read the relevant canon feature note immediately before any write, respect single-writer ownership, update ownership, task state, timestamps, and `Status History` in one save, then re-read to verify.
- Treat `Task Register` as the source of truth for active task state and update it at task start, on re-plan or blockage, on handoff, and on completion.

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Keep code impact minimal.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Change only what is necessary. Avoid introducing bugs.
