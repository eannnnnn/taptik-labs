## Workflow Orchestration

### 0. Required Startup Flow
- At the start of a session that includes complex work (3+ steps, cross-file changes, or architectural decisions), read `MEMORY.md` first. It is the memory index. Then read only the pointed memory-note caches there.
- Before touching workspace code, search `memories` for notes relevant to the current task scope.
- Do not re-read memory context for every later request in the same session. Refresh it only when the user explicitly asks for updated context.
- Keep `memories` and `canon` reads and writes sequential. Do not parallelize those flows.
- If either skill or its helper layer cannot provide the required context, stop and report the failure instead of silently working around it.
- `memories` stores reusable rules and behavior-changing memory notes. `canon` stores active feature scope, task state, ownership, and status history.

### 1. Execution Discipline
- Start complex work in plan mode and invest in the plan so implementation can finish in one pass.
- For complex work, use a second agent to review the plan before execution.
- If something goes sideways during complex work, return to plan mode immediately, update the active canon task note, and then re-plan.
- After workflow corrections that should change future behavior, save the durable behavior change as a memory note in `memories` and update `AGENTS.md` or `MEMORY.md` when the startup path should change.
- Verify the changed surface area and confirm the relevant checks passed before declaring work done.

### 2. Memory Rules
- Use `memories` as the only interface for memory load, save, and management.
- Do not read or write memory DB files or memory-note files directly unless migration or recovery explicitly requires it.
- Use property-first retrieval (`project`, `status`) before broader `tag:#memories` scope, and read full notes only when they are relevant to the current task.
- In project context, retrieval order is always project first, then global.
- If the user says phrases like `기억해`, `외워둬`, `메모리에 저장`, or `저장해`, treat that as a memory write command.
- Global save commands map to global scope. Project save commands map to project scope. If unspecified, default to project scope.
- After any correction from the user, save the behavior change through `memories` as one memory note at a time while preserving `name`, `project`, `tags`, and `status`.
- Add a memory note to `MEMORY.md` only when it changes default agent behavior across future sessions and should be loaded at startup.
- Do not register task-specific, temporary, or purely informational notes in `MEMORY.md`.

### 3. Canon Rules
- For complex work, canon is required. Trivial work does not require canon unless the user explicitly asks for canon tracking.
- Canon is the source of truth for task scope, ownership, and status. Execution todos are a derived checklist, not a second source of truth.
- A session may own only one active canon task note at a time. Hand off or close the current note before activating another.
- Execute work from the active canon task note: use that note to drive decisions and task state while making code changes in the workspace.
- Treat `canon/<project>/<domain>/<feature>.md` as an Obsidian-managed note path, never a workspace path.
- Never use workspace `Read`, `Write`, `Edit`, `apply_patch`, directory creation, or ad hoc local files as substitutes for canon note operations.
- Re-read the relevant canon feature note immediately before any write, respect single-writer ownership, update ownership, task state, timestamps, and `Status History` in one save, then re-read to verify.
- Treat `Task Register` as the source of truth for active task state and update it at task start, on re-plan or blockage, on handoff, and on completion.

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Keep code impact minimal.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Change only what is necessary. Avoid introducing bugs.
- **Operationalize Repetition**: If a workflow repeats more than once per day and the steps are stable enough to standardize, turn it into a Skill or Slash Command.
- **Remove Fresh Duplication**: After completing substantive work, check the changed surface area for duplicate code introduced by the work and merge or remove it when safe.
