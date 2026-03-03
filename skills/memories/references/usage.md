# Memory DB Usage

## Storage Model
- SQLite index: `~/.taptik/memory.sqlite` (global only)
- Global lesson files: `~/.taptik/lesson/*.md`
- Project lesson files: `<project_root>/.taptik/lesson/*.md`

SQLite stores metadata and file pointers:
- `title`, `summary`, `keywords`, `project_path`, `file_path`, timestamps

## Search and Load Strategy
1. Use `search` with keyword and project to load index rows only.
2. Use `get` for selected rows to lazy-load full markdown content.

## Command Snippets

```bash
# Install dependency
npm install

# Bun runtime is required
bun --version

# Run without global link
npm exec -- agent-memories --help
npm exec -- agent-memories init

# Init global DB
agent-memories init

# Project-scoped save
agent-memories upsert \
  --title "Prefer rg over grep" \
  --summary "Use rg for file/text search" \
  --content "Use rg --files for files and rg -n for content." \
  --keywords "search,tooling" \
  --scope project \
  --project-root /path/to/project

# Global-scoped save
agent-memories upsert \
  --title "Memory policy baseline" \
  --summary "Global default policy" \
  --content "Global content" \
  --keywords "memory,global" \
  --scope global

# Search with project context (project rows + global rows)
agent-memories search \
  --project-root /path/to/project \
  --keyword "leader" \
  --limit 20

# Vector indexing on upsert (embedding must be 384 numbers)
agent-memories upsert \
  --title "Vector memory" \
  --summary "semantic index" \
  --content "..." \
  --scope project \
  --project-root /path/to/project \
  --embedding "0.1,0.1,0.1,...(384 values)"

# Vector semantic search
agent-memories search \
  --project-root /path/to/project \
  --embedding "0.1,0.1,0.1,...(384 values)" \
  --limit 10

# Search project-only rows
agent-memories search \
  --project-root /path/to/project \
  --project-only \
  --keyword "leader"

# Lazy detail fetch by title
agent-memories get \
  --title "Prefer rg over grep" \
  --project-root /path/to/project
```
