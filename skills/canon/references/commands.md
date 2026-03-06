# Canon command reference (minimal)

`canon` should use a small command set repeatedly.

## Core rules

- Use `bash scripts/search.sh "<query>"` as the shorthand for `obsidian search ... path="canon"`.
- Start with project path filters, then add `feature_state` filters only when needed.
- For load-only work, prefer `/canon init` or a 2-4 command sequence.
- Treat `canon/<project>/...` as an Obsidian vault path, not a workspace directory.
- Run commands sequentially against the same note.
- Re-read a feature note immediately before any write.
- Avoid capability-discovery commands during normal retrieval.

## Slash-style entrypoint

Use `/canon init` as the default skill-facing bootstrap. Supported slash forms follow `../SKILL.md`.

Equivalent script invocation:

```bash
bash scripts/init.sh --project "<name>" --vault "<vault>" --feature-state "in_progress"
obsidian vault=<vault> read path="canon/<project>/<domain>/<feature>.md"
```

Project auto-detection and vault reuse follow `../SKILL.md` and `../REFERENCE.md`.

## Project fast path

```bash
bash scripts/search.sh "path:canon/<project>"
obsidian read path="canon/<project>/<domain>/<feature>.md"
```

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

`bash scripts/init.sh` returns project-first `ordered_paths`; detailed bootstrap semantics live in `../SKILL.md` and `../REFERENCE.md`.

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
- [search-syntax.md](search-syntax.md)
- [flow.md](flow.md)
