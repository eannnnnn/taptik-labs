---
name: memories
description: Obsidian-based memory operating system for SDD and reusable engineering patterns. Before each session or development kickoff, use an index-first flow with Search properties from the memory template (`name`, `project`, `status`, `tags`) and keep status in properties (`valid|invalid`).
argument-hint: "init [project=<name>] [vault=<name>] [status=<valid|invalid>]"
user-invokable: true
allowed-tools:
- "obsidian"
- "bash"
license: MIT
---

# Memories Skill

Use this skill for Obsidian memory load/save with an index-first flow.

## Command Contract

- Empty `<user-request>` means `init`.
- Supported init forms:
  - `/memories init`
  - `/memories init <project_name>`
  - `/memories init project=<name> vault=<name> status=<valid|invalid>`

## Init Flow (Deterministic)

1. Run `bash scripts/init.sh [--project <name>] [--vault <name>] [--status <valid|invalid>]`.
2. Read `ordered_paths` from returned JSON.
3. Run `obsidian read path="<path>"` sequentially for each path.
4. Report grouped result: project notes first, then global notes.

Project auto-detection in `init.sh`:

1. `OPENCODE_PROJECT_DIR` basename (if set)
2. Git repository root basename
3. Current directory basename

## Core Rules

- Search first, read second.
- Keep Obsidian calls sequential.
- For load-only flows, keep command budget small (2-4 commands).
- Avoid capability discovery (`obsidian --help`, `obsidian vaults`) unless failing.

## Save Pattern

- Use template shape from `templates/memory-note-template.md`.
- Write one note at a time with `obsidian create ... overwrite`.
- Keep `status` as `valid` or `invalid`.

## References

- `scripts/init.sh` for `/memories init` bootstrap
- `scripts/search.sh` for property/tag search
- `REFERENCE.md`
- `references/commands.md`
- `references/flow.md`
- `references/search-syntax.md`
