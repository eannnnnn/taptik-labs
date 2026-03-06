---
name: memories
description: Obsidian-based memory operating system for SDD and reusable engineering patterns. Before each session or development kickoff, use an index-first flow with Search properties from the memory template (`name`, `project`, `status`, `tags`) and keep status in properties (`valid|invalid`).
allowed-tools:
- "obsidian"
license: MIT
---

# Obsidian Search-Driven Memories

Use lightweight templates as guidance. Agents can run `obsidian` commands directly for autonomous operation.

## Template Intent

- `scripts/search.sh` is the required search entrypoint for standard discovery in this skill.
- `templates/memory-note-template.md` is the recommended Obsidian note scaffold with frontmatter fields (`name`, `project`, `tags`, `status`) and reusable sections.
- Use `scripts/search.sh` for discovery and `obsidian read/create` only for selected note actions.
- Follow an index-first approach: search template properties first (`project`, `status`), then read selected note paths.
- If the task needs custom behavior, run direct `obsidian search/read/create` commands instead of extending template logic.
- Run `obsidian` CLI calls sequentially (avoid parallel invocation bursts), because rapid concurrent launches can churn the app bridge.
- For optional environment overrides, see [REFERENCE.md](REFERENCE.md).

## Fast Path (No Waste)

Use this exact order unless the task explicitly asks for something else.

1. Run one property-first search with `scripts/search.sh`.
2. If results exist, read only selected note paths.
3. If no results, run one fallback query, then read selected notes.
4. Stop searching once enough context is loaded.

Avoid these unless there is a concrete failure that requires them:

- `obsidian --help`
- `obsidian vaults`
- broad exploratory queries before property-first queries

### Global Memory Load (Recommended)

Run from `skills/memories` directory:

```bash
bash scripts/search.sh "[project:global] [status:valid] tag:#memories"
obsidian read path="memories/<selected-note>.md"
```

If your first query returns no matches, do one controlled fallback:

```bash
bash scripts/search.sh "[project:global] tag:#memories"
```

### Execution Guardrails

- Command budget for load-only tasks: 2-4 commands total.
- Never run capability discovery commands (`obsidian --help`, `obsidian vaults`) during normal load flow.
- Never run parallel Obsidian commands against the same target.
- Search first, read second. Do not read notes before search results exist.

## Autonomous Agent Guide

1. Before each session or development kickoff, run index-first discovery with template-property queries (prioritize `[project:<name>]` and `[status:...]`).
2. Read only selected note paths.
3. Create or overwrite the target memory note using `templates/memory-note-template.md` structure.

```bash
bash scripts/search.sh "[project:<name>]"
bash scripts/search.sh "[status:valid] OR [status:invalid]"
bash scripts/search.sh "tag:#memories"
obsidian read path="memories/2026-03-05-auth-refresh.md"
obsidian create path="memories/2026-03-05-auth-refresh.md" content="---
name: \"Auth refresh strategy\"
project: \"taptik\"
tags:
  - memories
  - project/taptik
  - pattern/auth
status: \"valid\"
---

# Auth refresh strategy

Use short-lived access tokens" overwrite
```

## Search Policy

- Required tag: `#memories`
- Recommended tags: `#sdd`, `#project/<name>`, `#pattern/<name>`, `#decision`
- Template status property: `status: valid | invalid` (use property search like `[status:valid]`)
- Keep tags lowercase and consistent to avoid fragmented search results.

## Freshness and Overwrite Rules

1. Do not trust old notes by default; re-check tagged notes before reuse.
2. If facts changed, create a new memory and mark old notes as `status: invalid`.
3. Keep one canonical active note per topic when possible.
4. Use Obsidian local history for recovery on mistaken overwrite.

## Quick Start

```bash
bash scripts/search.sh "[project:<name>]"
bash scripts/search.sh "[status:valid]"
bash scripts/search.sh "tag:#memories"
obsidian read path="memories/<selected-note>.md"
obsidian create path="memories/<date>-<slug>.md" content="<follow templates/memory-note-template.md>" overwrite
```

## Safe Write Pattern

Use one write at a time.

```bash
obsidian create path="memories/<date>-<slug>.md" content="<follow templates/memory-note-template.md>" overwrite
```

## Operational Templates

| Template | Purpose |
|----------|---------|
| [scripts/search.sh](scripts/search.sh) | Default search entrypoint for index-first discovery (`bash scripts/search.sh "<query>"`) |
| [templates/memory-note-template.md](templates/memory-note-template.md) | Obsidian memory note markdown template with frontmatter + rule/constraints/examples/reference sections |


## Deep-Dive Documentation

| Reference | When to Use |
|-----------|-------------|
| [REFERENCE.md](REFERENCE.md) | Vault option guidance for shell usage |
| [references/search-syntax.md](references/search-syntax.md) | Concise official Obsidian Search/CLI syntax distilled for memories workflow |
| [references/commands.md](references/commands.md) | Minimal command set for everyday memory operations |
| [references/flow.md](references/flow.md) | Search-driven template/property-first load/save/verify workflow and operational logic |
