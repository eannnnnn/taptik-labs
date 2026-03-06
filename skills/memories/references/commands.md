# Memories command reference (minimal)

`memories` skill should use a small command set repeatedly.

## Core rules

- Use `bash scripts/search.sh "<query>"` for discovery.
- Prefer property-first queries (`project`, `status`) and keep `tag:#memories` as scope.
- Run commands sequentially against the same target.
- For load-only tasks, keep command budget to 2-4 commands.
- Avoid `obsidian --help` and `obsidian vaults` during normal retrieval.

## Global fast path

```bash
bash scripts/search.sh "[project:global] [status:valid] tag:#memories"
obsidian read path="memories/<selected-note>.md"
```

## Session-start discovery

```bash
bash scripts/search.sh "[project:<name>]"
bash scripts/search.sh "[status:valid]"
bash scripts/search.sh "tag:#memories"
obsidian read path="memories/<selected-note>.md"
```

## Save patterns

Use the template structure from `../templates/memory-note-template.md`:

```bash
obsidian create path="memories/<date>-<slug>.md" content="<follow templates/memory-note-template.md>" overwrite
```

Direct create example:

```bash
obsidian create path="memories/<date>-<slug>.md" content="---
name: \"<title>\"
project: \"<project>\"
tags:
  - memories
status: \"valid\"
---

# <title>

<body>" overwrite
```

## Environment override

For non-default environment overrides, follow `../REFERENCE.md`.

## Internal references

- [search-syntax.md](search-syntax.md)
- [flow.md](flow.md)
