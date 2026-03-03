## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately – don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Multi Agent Strategy
- Use `task` with supported agents directly (`explore`, `librarian`, `oracle`, `metis`, `momus`)
- Run independent searches and checks in parallel background tasks
- Keep prompts explicit: task, expected outcome, tool constraints, and context
- Keep the main context window clean: main agent handles user alignment and final synthesis
- For complex problems, increase parallelism with clear acceptance criteria per subtask

### 3. Self-Improvement Loop
- After ANY correction from the user: save a lesson through the `memories` skill
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- At session start, load memory index first and fetch details only for relevant lessons

### 3.1 Lessons Scope and Priority
- Use `memories` skill as the only interface for memory load/save/manage.
- Do not read/write memory DB or lesson files directly unless migration/recovery requires it.
- Session-start rule:
- At the beginning of a session, use the skill to load index rows first (`title/summary/keywords` only).
- Then load full lesson content only for titles needed for the current task.
- Memory-save trigger rule:
- If the user says phrases like `기억해`, `외워둬`, `메모리에 저장`, `저장해`, treat it as a memory write command.
- For global commands (e.g. `글로벌에 저장`), save with global scope via the skill.
- For project commands (e.g. `이 프로젝트에서 기억`), save with project scope via the skill.
- If scope is not specified, default to project scope.
- Retrieval priority in project context is always project first, then global.

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes – don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests – then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `<project_root>/.taptik/tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `<project_root>/.taptik/tasks/todo.md`
6. **Capture Lessons**: Save lessons through `memories` skill after corrections
7. **Skill-First Memory Operations**:
   - At session start, load memory through `memories` index-first, then lazy detail fetch.
   - On explicit memory commands (`기억해`, `외워둬`, `메모리에 저장`, `저장해`), always write via `memories`.
   - Scope mapping: global command -> global scope, project command -> project scope, unspecified -> project scope.
   - Search order in project context: project -> global.
8. **Close Todo**: After finishing a feature, delete completed todo entries in `<project_root>/.taptik/tasks/todo.md` to optimize token usage and keep only actionable items.

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
