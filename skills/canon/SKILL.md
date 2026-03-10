---
name: canon
description: Obsidian-first SDD workflow for complex work, feature tickets, task state, and multi-session handoffs under `canon/<project>/...`. Use this skill to drive one active canon task note per session and keep feature/task history in Obsidian instead of local scratch files.
argument-hint: "path=<canon/<project>/<domain>/<feature>.md> [project=<name>] [feature_state=<state>]"
user-invokable: true
allowed-tools:
- "obsidian"
- "bash"
license: MIT
---

# Canon Skill

Use this skill for Obsidian-first SDD workflows rooted at `canon`.

## Command Contract

- Supported write forms:
  - `/canon create path=<canon/<project>/<domain>/<feature>.md>`
  - `/canon update path=<canon/<project>/<domain>/<feature>.md>`
  - `/canon handoff path=<canon/<project>/<domain>/<feature>.md>`
- For write forms, `path=` is required and must stay within `canon/<project>/<domain>/<feature>.md`; otherwise stop and report an invalid canon path.

## Discovery Flow (Deterministic)

1. Start all discovery from `path="canon/<project>"`.
2. Narrow with `[feature_state:<state>]` only when needed.
3. Read the selected canon note through `obsidian read path="canon/<project>/<domain>/<feature>.md"`.
4. Use one active canon task note per session for complex work.

## Complex Work Flow (Deterministic)

1. For complex work, load the relevant canon context before touching workspace code.
2. Produce an initial plan for the active canon task note.
3. Use multi-agent verification to check that draft plan against memory, canon scope, and current repo state.
4. Finalize the plan in the canon note, then derive execution todos from that note.
5. Execute task work from the active canon note while updating task state and history in Obsidian.

## Create / Update Flow (Deterministic)

1. Treat every `canon/...` reference as an Obsidian vault note path, never a workspace path.
2. Never use workspace `Read`, `Write`, `Edit`, `apply_patch`, or directory creation on `canon/...` note paths.
3. For creation, use `obsidian create path="canon/<project>/<domain>/<feature>.md" content="<follow templates/feature-note-template.md>" overwrite`.
4. For updates, run `obsidian read path="canon/<project>/<domain>/<feature>.md"` first, then rewrite with `obsidian create ... overwrite`.
5. If `obsidian` cannot be used for canon notes, stop and report the failure instead of falling back to local file tools.

## Claim / Handoff Flow (Deterministic)

1. Read the existing note with `obsidian read path="canon/<project>/<domain>/<feature>.md"`.
2. For claim/update, confirm ownership rules, then update `feature_state`, `owner_session`, `owner_agent`, `claimed_at`, `updated_at`, the affected `Task Register` entry, and `Status History` in one `obsidian create ... overwrite` call.
3. For handoff, preserve current task state, append a handoff history entry, then update ownership fields deliberately in one `obsidian create ... overwrite` call.
4. Re-read the note after each claim or handoff write to verify the change landed as expected.

## Core Rules

- Search first, read second.
- Start all discovery from `path="canon"` and narrow to `canon/<project>` for active work.
- Canon notes live in Obsidian, not the workspace. Never create or edit `canon/...` with local filesystem tools; use `obsidian search/read/create` against canon note paths.
- If `obsidian` cannot be used for canon notes, stop with an error. Never fall back to `mkdir`, `apply_patch`, `Write`, or other workspace file creation for canon notes.
- For complex work, canon is required. Trivial work does not require canon unless the user explicitly asks for canon tracking.
- Use canon as the source of truth for task scope, ownership, and status; execution todos are a derived checklist.
- Re-read a feature note immediately before any write.
- A session may own only one active canon task note at a time.
- Treat each feature note as single-writer while claimed.
- Shared-section writes are allowed only when the note is unowned, already owned by the current `owner_session`, or explicitly being handed off.
- Only the owning session may rewrite shared sections like overview, acceptance criteria, or Mermaid context.
- Apply task-state, ownership, timestamp, and history updates in one save.
- After create, update, or handoff writes, re-read the note and verify ownership/task/history fields.
- Release or hand off ownership explicitly; never reset ownership silently.
- Keep Obsidian calls sequential.

## Feature Note Contract

 - Vault note path: `canon/<project>/<domain>/<feature>.md`
- Use `templates/feature-note-template.md` for note shape.
- Read and write feature notes via `obsidian` commands against the vault path, not workspace files.
- Frontmatter must include `feature_state`, `owner_session`, `owner_agent`, `claimed_at`, and `updated_at`.
- `Task Register` is the canonical task-state view; add checkbox tasks only when you need Obsidian Tasks CLI convenience.
- Task entries must use stable task IDs and track `state`, `owner_session`, and `updated_at`.
- History must stay append-only so concurrent sessions can reconstruct changes.

## References

- `scripts/search.sh` for path-scoped search
- `REFERENCE.md`
- `references/commands.md`
- `references/flow.md`
- `references/search-syntax.md`
- `templates/feature-note-template.md`
