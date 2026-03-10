---
name: memories
description: Obsidian-based memory operating system for SDD and reusable engineering patterns. Use an index-first flow with Search properties from the memory template (`name`, `project`, `status`, `tags`) and keep status in properties (`valid|invalid`).
argument-hint: "project=<name> [status=<valid|invalid>] [tag=<tag>]"
user-invokable: true
allowed-tools:
- "obsidian"
- "bash"
license: MIT
---

# Memories Skill

Use this skill for Obsidian memory load/save with an index-first flow.

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

- `scripts/search.sh` for property/tag search
- `REFERENCE.md`
- `references/commands.md`
- `references/flow.md`
- `references/search-syntax.md`
