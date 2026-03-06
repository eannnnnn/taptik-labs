# Obsidian Vault Option Guide

Use this guide when selecting whether to pass `vault=<name>` to `obsidian` commands.

## Default Behavior

- If your active Obsidian vault is already the target vault, run commands without `vault=<name>`.
- If you need a non-active vault, pass `vault=<name>` explicitly.

## Session-Start Pattern

Before each session or development kickoff, use an index-first flow: query template properties first (`project`, `status`), then use `#memories` tag scope.

```bash
obsidian search query="[project:<name>]" path="memories" format=json
obsidian search query="[status:valid] OR [status:invalid]" path="memories" format=json
obsidian search query="tag:#memories" path="memories" format=json
obsidian read path="memories/<selected-note>.md"
```

In project context, prioritize `[project:<name>]` results before broader tag queries.

## Safe Write Pattern

Use one write at a time and follow `templates/memory-note-template.md` frontmatter (`name/project/tags/status`).

```bash
obsidian create path="memories/<date>-<slug>.md" content="<follow templates/memory-note-template.md>" overwrite
```

## Vault Option Examples

```bash
# Active vault is correct
obsidian search query="[status:valid]" path="memories" format=json

# Target a specific vault
obsidian vault=<your_vault> search query="[status:valid]" path="memories" format=json
```
