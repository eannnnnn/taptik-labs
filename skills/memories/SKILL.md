---
name: memories
description: Manage AI memory using one global SQLite index plus lesson markdown files in global and project folders. Use when tasks involve saving lessons, searching by keyword and project scope, and loading full lesson content only when needed.
---

# Memory Manager

Use this skill as the single memory interface for lessons.

## Workflow
1. Use one global SQLite index:
- `~/.taptik/memory.sqlite`
2. Store lesson markdown files by scope:
- Global lessons: `~/.taptik/lesson/*.md`
- Project lessons: `<project_root>/.taptik/lesson/*.md`
3. Keep SQLite rows lightweight:
- Row metadata: `title`, `summary`, `keywords`, `project_path`, `file_path`, timestamps
- Full body lives in the markdown file referenced by `file_path`
4. Load index first, then lazy-load detail:
- Use `search` to retrieve candidate rows by keyword/project
- Use `get` only for the rows needed for the current task
5. Save by scope:
- Global memory: `--scope global`
- Project memory: `--scope project --project-root <path>`

## Commands

**Important**: `agent-memories` is not in PATH. You MUST run from the skill directory using `npm exec`.

### Run from skill directory (Recommended)

```bash
cd skills/memories
bun install  # Install dependencies once

# Run commands
npm exec -- agent-memories --help
npm exec -- agent-memories init
```

### Usage Examples

```bash
# Initialize (global SQLite)
agent-memories init

# Save/update a project-scoped lesson
agent-memories upsert \
  --title "Lesson title" \
  --summary "One-line summary" \
  --content "Detailed lesson body" \
  --keywords "tag1,tag2" \
  --scope project \
  --project-root .

# Save/update a global-scoped lesson
agent-memories upsert \
  --title "Global lesson" \
  --summary "Reusable across projects" \
  --content "Global lesson body" \
  --keywords "global,memory" \
  --scope global

# Search by keyword + project (project rows first, then global rows)
agent-memories search \
  --project-root . \
  --keyword "sandbox" \
  --limit 20

# Optional vector upsert + semantic search (384-dim embedding)
agent-memories upsert \
  --title "Vector lesson" \
  --summary "Indexed by embedding" \
  --content "..." \
  --scope project \
  --project-root . \
  --embedding "0.1,0.1,0.1,...(384 values)"

agent-memories search \
  --project-root . \
  --embedding "0.1,0.1,0.1,...(384 values)" \
  --limit 10

# Lazy detail fetch
agent-memories get \
  --title "Lesson title" \
  --project-root .
```

## References
- For path rules and command snippets, read `references/usage.md`.
