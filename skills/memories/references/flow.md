# Search-Driven Template Memory Flow

Operational guidance for autonomous agent usage with minimal templates.

**Related**: [../REFERENCE.md](../REFERENCE.md), [commands.md](./commands.md), [search-syntax.md](./search-syntax.md)

## Intent

- Keep template shells minimal.
- Let agents drive with `bash scripts/search.sh` for discovery and direct `obsidian read/create` for selected note actions.
- When memory context is needed, refer to `MEMORY.md` for read order and then use an index-first flow (template properties first, then `#memories` scope tag).
- In project context, read project memory first, then read global memory, and broaden queries only after that ordered pass.
- Use `templates/memory-note-template.md` for create/update structure.

## Autonomous Loop (Fast Path)

```bash
bash scripts/search.sh "[project:<name>]"
bash scripts/search.sh "[status:valid] OR [status:invalid]"
bash scripts/search.sh "tag:#memories"
obsidian read path="memories/<selected-note>.md"
obsidian create path="memories/<date>-<slug>.md" content="<follow templates/memory-note-template.md>" overwrite
```

## Project-First Read Order

Read project memory first, then read global memory:

```bash
bash scripts/search.sh "[project:<name>]"
obsidian read path="memories/<selected-note>.md"
bash scripts/search.sh "[project:global] [status:valid] tag:#memories"
obsidian read path="memories/<selected-note>.md"
```

## Global Load Fast Path

```bash
bash scripts/search.sh "[project:global] [status:valid] tag:#memories"
obsidian read path="memories/<selected-note>.md"
```

Fallback only when no match:

```bash
bash scripts/search.sh "[project:global] tag:#memories"
```

## Template Inputs

`search.sh`:

```bash
bash scripts/search.sh "<query>"
```

Equivalent internal command:

```bash
# Single Tag
obsidian search query="tag:#<tag>" path="memories" format=json

# Multiple Tag ( AND )
obsidian search query="tag:#<tag1> tag:#<tag2>" path="memories" format=json

# Multiple Tag ( OR )
obsidian search query="tag:#<tag1> OR tag:#<tag2>" path="memories" format=json
```

Template property-first commands:

```bash
obsidian search query="[project:<name>]" path="memories" format=json
obsidian search query="[status:valid]" path="memories" format=json
obsidian search query="[status:invalid]" path="memories" format=json
```

Examples:

```bash
bash scripts/search.sh "tag:#memories"
bash scripts/search.sh "[project:global] [status:valid] tag:#memories"
obsidian create path="memories/2026-03-06-auth-refresh.md" content="<follow templates/memory-note-template.md>" overwrite
```

## Direct Command Equivalents

```bash
obsidian search query="[status:valid] tag:#memories" path="memories" format=json
obsidian read path="memories/<selected-note>.md"
obsidian create path="memories/<date>-<slug>.md" content="---
name: \"<title>\"
project: \"<project>\"
tags:
  - memories
  - project/<name>
status: \"valid\"
---

# <title>

<body>" overwrite
```

## Bootstrap

```bash
obsidian create path="memories/<date>-first-memory.md" content="<follow templates/memory-note-template.md>" overwrite
```

## Failure Handling

- If `obsidian` is not found, re-enable CLI integration and restart terminal.
- Run one `obsidian` command at a time; avoid parallel command storms against the same target.
- If retrieval is noisy, narrow with property filters (for example `[project:<name>]`, `[status:valid]`) and then add tag filters.
- Avoid capability-discovery commands (`obsidian --help`, `obsidian vaults`) in normal load flow.
