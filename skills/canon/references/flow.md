# Canon SDD Flow

Operational guidance for autonomous agent usage with Obsidian as the source of truth for SDD work.

**Related**: [../REFERENCE.md](../REFERENCE.md), [commands.md](commands.md), [search-syntax.md](search-syntax.md)

## Intent

- Keep feature specs, task state, and completion history in `canon`.
- Default to `canon/<project>/...` for active work.
- Use feature Markdown files as lightweight tickets.
- Keep Mermaid context maps inside feature notes.
- Prevent silent overwrites when concurrent sessions exist.

## Autonomous Loop (Fast Path)

```bash
bash scripts/search.sh "path:canon/<project>"
bash scripts/search.sh "[feature_state:in_progress] path:canon/<project>"
obsidian read path="canon/<project>/<domain>/<feature>.md"
obsidian create path="canon/<project>/<domain>/<feature>.md" content="<follow templates/feature-note-template.md>" overwrite
```

## Slash Init Flow (`/canon init`)

Use this when the skill should load active project context and then shared/global context:

```bash
bash scripts/init.sh
```

Project auto-detection, overrides, and vault reuse follow `../SKILL.md` and `../REFERENCE.md`.

Then read notes from `ordered_paths` sequentially via `obsidian read`.
If the bootstrap returned a non-empty vault, reuse that same `vault=<name>` for every read.

## Claim / Update Loop

1. Read the note through `obsidian read`.
2. Confirm the note is unowned, already owned by the current `owner_session`, or explicitly being handed off.
3. Rewrite the note through `obsidian create ... overwrite` with updated ownership fields, task state, timestamps, and a matching history entry.
4. Re-read the note and verify the new owner/task state.

## Tasks Loop

- Treat `Task Register` as the canonical task-state view for the feature note.
- Add a `CLI Tasks` checkbox section only when you want `obsidian tasks` / `obsidian task` convenience for a subset of tasks.
- When task state changes, update the register and append a matching history entry in the same save.

## Read-Mostly Sections

- `Overview`
- `Acceptance Criteria`
- `Mermaid Context Map`

These sections should rarely change after a feature is claimed.

## Feature State Model

- `todo -> in_progress -> blocked | review -> done`
- `cancelled` may be used from any non-done state

## Task State Model

- `todo -> in_progress -> blocked | review -> done`
- `cancelled` may be used from any non-done state

## Handoff Rule

- If a claim becomes stale, re-read once, write a handoff entry in history, and then change ownership deliberately.
- `stale` is not time-based by default in this skill.
- Preserve current task state during handoff.
- Never clear ownership or reset tasks without recording why.

## Handoff Loop

1. Read the note through `obsidian read`.
2. Append a handoff entry that records previous owner, next owner, and why the handoff happened.
3. Rewrite the note through `obsidian create ... overwrite` with updated owner fields and `updated_at`.
4. Re-read the note and verify that ownership changed while task state stayed intact.

## Failure Handling

- If `obsidian` is not found, re-enable CLI integration and restart terminal.
- Run one `obsidian` command at a time; avoid parallel writes against the same feature note.
- If ownership changed unexpectedly, stop and re-read instead of overwriting.
- If a repo-local `canon/` directory appears during skill execution, treat it as a misplaced scratch artifact, remove it, and recreate the note through Obsidian.
- If retrieval is noisy, narrow with `path:canon/<project>` first, then add `[feature_state:<state>]`.
