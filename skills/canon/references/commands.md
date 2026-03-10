# Canon command reference (minimal)

`canon` should use a small command set repeatedly.

## Core rules

- Use `bash scripts/search.sh "<query>"` as the shorthand for `obsidian search ... path="canon"`.
- Start with project path filters, then add `feature_state` filters only when needed.
- For complex work, use canon as the source of truth and keep one active canon task note per session.
- Treat `canon/<project>/...` as an Obsidian vault path, not a workspace directory.
- Run commands sequentially against the same note.
- Re-read a feature note immediately before any write.
- Avoid capability-discovery commands during normal retrieval.

## Canon-guided discovery

For complex work, start from the relevant project scope and select one active canon task note.

Project fast path:

```bash
bash scripts/search.sh "path:canon/<project>"
obsidian read path="canon/<project>/<domain>/<feature>.md"
```

If the result set is still broad, narrow with `feature_state` filters.

## Planning flow

```bash
obsidian read path="canon/<project>/<domain>/<feature>.md"
obsidian create path="canon/<project>/<domain>/<feature>.md" content="<initial plan + multi-agent verification + final plan + task register>" overwrite
obsidian read path="canon/<project>/<domain>/<feature>.md"
```

For complex work, use this order: initial plan -> multi-agent verification against memory, canon scope, and current repo state -> finalize plan -> create execution todos -> execute.

## Filter by feature state

```bash
bash scripts/search.sh "[feature_state:in_progress] path:canon/<project>"
bash scripts/search.sh "[feature_state:blocked] path:canon/<project>"
```

## Shared/global fast path

```bash
bash scripts/search.sh "path:canon/global"
obsidian read path="canon/global/<note>.md"
```

## Create or update a feature note

Use the template structure from `../templates/feature-note-template.md`:

```bash
obsidian create path="canon/<project>/<domain>/<feature>.md" content="<follow templates/feature-note-template.md>" overwrite
```

Do not replace this with repo-local file creation under the current working tree.

Recommended write sequence:

```bash
obsidian read path="canon/<project>/<domain>/<feature>.md"
obsidian create path="canon/<project>/<domain>/<feature>.md" content="<updated canon note>" overwrite
obsidian read path="canon/<project>/<domain>/<feature>.md"
```

For claim/update writes, change ownership, timestamps, task state, and history together.

Execution todos outside canon are derived checklists. `Task Register` remains the source of truth.

For handoff writes, preserve task state, append a handoff history entry, then update the owner fields.

## Tasks commands

The official CLI exposes both `tasks` (list) and `task` (inspect or update) for Markdown checkbox tasks. `Task Register` remains canonical; add checkbox lines only when you want CLI-native toggles.

```bash
# List incomplete checkbox tasks when the note has them
obsidian tasks path="canon/<project>/<domain>/<feature>.md" todo verbose format=json

# Mark one task as done or todo
obsidian task path="canon/<project>/<domain>/<feature>.md" line=<n> done
obsidian task path="canon/<project>/<domain>/<feature>.md" line=<n> todo

# Toggle by explicit task reference
obsidian task ref="canon/<project>/<domain>/<feature>.md:<line>" toggle
```

If you add checkbox tasks, keep them in a small optional `CLI Tasks` section so these commands stay isolated from the structured `Task Register` text.

## Internal references

- [install.md](install.md)
- [search-syntax.md](./search-syntax.md)
- [flow.md](./flow.md)
