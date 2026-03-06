# Obsidian Search + CLI (Concise)

This is a compact internal summary of the official Obsidian Search and CLI docs, tuned for `memories` usage.

## 1) Query grammar (Search)

- `A B` means AND.
- `A OR B` means OR.
- `-A` excludes matches.
- Parentheses are supported: `(A OR B) C`.

## 2) Property queries (template-friendly)

- `[property]` => notes that have the property.
- `[property:value]` => notes where property matches value.
- Example: `[status:valid]`, `[project:taptik]`, `[status:valid OR invalid]`.
- `null` works for empty property values: `[status:null]`.

## 3) Tag queries

- Use `tag:#...` for explicit tag matching.
- Prefer `tag:` over plain `#tag` text search when filtering notes.
- Example: `tag:#memories`

## 4) Path scoping

- In Search query text, `path:` operator filters by file path.
- In CLI command, `path="memories"` scopes command results to folder.

## 5) CLI search parameters
- `obsidian search query="..."` (required).
- Optional: `path=`, `format=`, `limit=`, `case`, `total`.
- Use query-first style for consistency in this repo.

## 6) Recommended patterns for this skill

```bash
obsidian search query="[project:<name>]" path="memories" format=json
obsidian search query="[status:valid] OR [status:invalid]" path="memories" format=json
obsidian search query="[status:valid] tag:#memories" path="memories" format=json
obsidian search query="[status:invalid] tag:#memories" path="memories" format=json
```

## 7) Why this shape

- Property-first queries align with [template](../templates/memory-note-template.md) frontmatter.
- Tag queries keep topic/project scope (`#memories`, `#project/...`, `#pattern/...`).
- `path="memories"` keeps retrieval focused and low-noise.

## 8) Status mapping convention

- Canonical property: `status: valid | invalid`
- Do not encode status in tags.
