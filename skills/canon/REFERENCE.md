# Canon Vault Option Guide

Use this guide when deciding whether to pass `vault=<name>` to `obsidian` commands.

## Default Behavior

- If your active Obsidian vault is already the target vault, run commands without `vault=<name>`.
- If you need a non-active vault, pass `vault=<name>` explicitly.

## Complex Work Discovery

For complex work, load the active project view first and optionally narrow by feature state.

```bash
obsidian search query="path:canon/<project>" path="canon" format=json
obsidian search query="[feature_state:in_progress] path:canon/<project>" path="canon" format=json
obsidian search query="path:canon/global" path="canon" format=json
obsidian read path="canon/<project>/<domain>/<feature>.md"
```

Project context should be prioritized before broader shared/global notes.

Use one active canon task note per session. After selecting the note, keep planning, verification, task state, and execution anchored to that note.

## Complex Work Flow

For complex work, use this order:

1. create an initial plan for the active canon note
2. verify that plan against memory, canon scope, and current repo state with specialist agents as needed
3. finalize the plan in the canon note
4. derive execution todos from the canon note
5. execute task work from the canon note while updating `Task Register` and `Status History`

## Safe Write Pattern

Use one write at a time and follow `templates/feature-note-template.md`.

Canon feature notes are vault notes. Do not create repo-local `canon/...` files as substitutes.

```bash
obsidian read path="canon/<project>/<domain>/<feature>.md"
obsidian create path="canon/<project>/<domain>/<feature>.md" content="<follow templates/feature-note-template.md>" overwrite
```

Before overwriting a feature note:

- confirm `owner_session` rules still allow the write
- update ownership, timestamps, task register, and history together
- append a history entry instead of rewriting old history lines
- if ownership looks stale, re-read once more, append a handoff entry, then change the owner deliberately

For complex work, `Task Register` remains canonical and todos outside canon should be treated as derived execution checklists only.

## Tasks CLI Integration

The official Obsidian CLI `tasks` and `task` commands work against Markdown task lines. In canon, `Task Register` remains the source of truth; add checkbox tasks only when you want CLI-native toggles in the same note.

```bash
# List incomplete tasks for one feature note
obsidian tasks path="canon/<project>/<domain>/<feature>.md" todo verbose format=json

# Mark a specific task line as done
obsidian task path="canon/<project>/<domain>/<feature>.md" line=<n> done

# Toggle by explicit task reference
obsidian task ref="canon/<project>/<domain>/<feature>.md:<line>" toggle
```

Use the structured `Task Register` for stable task metadata. If you add a `CLI Tasks` section, keep only the checkbox lines you want the Obsidian Tasks CLI to control.

## Vault Option Examples

```bash
# Active vault is correct
obsidian search query="path:canon/labs" path="canon" format=json

# Target a specific vault
obsidian vault=<your_vault> search query="path:canon/labs" path="canon" format=json
```
