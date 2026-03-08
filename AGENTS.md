## Workflow Orchestration

### 0. Canon And Memories First
- For any non-trivial development task, start with `/memories init`, then `/canon init`, then read the returned notes before touching workspace code.
- Treat this startup sequence as mandatory, not advisory. Do not begin implementation, debugging, or planning without loaded memory and canon context.
- If either skill cannot provide the required context, stop and report the failure instead of silently working around it.
- `memories` stores lessons and reusable rules. `canon` stores active feature scope, task state, ownership, and status history.

### 1. Execution Discipline
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions).
- If something goes sideways, STOP, reload the relevant canon or memory context, and then re-plan.
- Verify before declaring work done.

### 2. Memory Capture
- After ANY correction from the user, save a lesson through the `memories` skill.
- Use `memories` as the only interface for memory load, save, and management.
- Do not read or write memory DB files or lesson files directly unless migration or recovery explicitly requires it.
- Use property-first retrieval (`project`, `status`) before broader `tag:#memories` scope.
- Read full memory notes only for items relevant to the current task.
- In project context, retrieval order is always project first, then global.
- If the user says phrases like `기억해`, `외워둬`, `메모리에 저장`, or `저장해`, treat that as a memory write command.
- Global save commands map to global scope. Project save commands map to project scope. If unspecified, default to project scope.
- Memory writes must go through `memories`, one note at a time, while preserving the supported fields `name`, `project`, `tags`, and `status`.

## Task Management

1. **Memory Bootstrap**: Start each session with `/memories init`, then read only the relevant memory notes returned by the index-first flow.
2. **Canon Bootstrap**: Before implementation, run `/canon init`, then read the returned project notes first and shared notes second.
3. **Sequential Obsidian Flow**: Keep `canon` and `memories` reads and writes sequential. Do not parallelize those flows.
4. **Canon Path Semantics**: Treat `canon/<project>/<domain>/<feature>.md` as an Obsidian-managed note path, never a workspace path.
5. **Canon Tool Boundary**: Never use workspace `Read`, `Write`, `Edit`, `apply_patch`, directory creation, or ad hoc local files as substitutes for canon note operations.
6. **Canon Failure Handling**: If Obsidian or canon helper scripts are unavailable, stop and report the failure. Do not fall back to local filesystem edits for canon notes.
7. **Canon Ownership And Writes**: Re-read the relevant canon feature note immediately before any write, respect single-writer ownership, update ownership/task state/timestamps/`Status History` in one save, then re-read to verify.
8. **Canonical Task State**: Treat `Task Register` as the source of truth for active task state and record concise progress, review, and completion updates there.
9. **Memory Scope Rules**: Global save commands map to global scope, project save commands map to project scope, and unspecified scope defaults to project scope.

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Keep code impact minimal.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Change only what is necessary. Avoid introducing bugs.
