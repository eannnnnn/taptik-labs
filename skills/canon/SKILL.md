---
name: canon
description: Obsidian-first SDD workflow for specs, feature tickets, task state, and multi-session handoffs under `canon/<project>/...`. Use this skill to load active feature notes, manage ownership safely, and keep feature/task history in Obsidian instead of local scratch files.
argument-hint: "init [project=<name>] [vault=<name>] [feature_state=<state>]"
user-invokable: true
allowed-tools:
- "obsidian"
- "bash"
license: MIT
---

# Canon Skill

Use this skill for Obsidian-first SDD workflows rooted at `canon`.

## Command Contract

- Empty `<user-request>` means `init`.
- Supported init forms:
  - `/canon init`
  - `/canon init <project_name>`
  - `/canon init project=<name> vault=<name> feature_state=<state>`
- Supported write forms:
  - `/canon create path=<canon/<project>/<domain>/<feature>.md>`
  - `/canon update path=<canon/<project>/<domain>/<feature>.md>`
  - `/canon handoff path=<canon/<project>/<domain>/<feature>.md>`
- For write forms, `path=` is required and must stay within `canon/<project>/<domain>/<feature>.md`; otherwise stop and report an invalid canon path.

## Init Flow (Deterministic)

1. Run `bash scripts/init.sh [--project <name>] [--vault <name>] [--feature-state <state>]`.
2. Read `ordered_paths` from returned JSON.
3. Run `obsidian read path="<path>"` sequentially for each path, reusing `vault=<name>` whenever the bootstrap returned a non-empty vault.
4. Report grouped result: project notes first, then shared/global notes.

## Create / Update Flow (Deterministic)

1. Treat every `canon/...` reference as an Obsidian vault note path, never a workspace path.
2. Never use workspace `Read`, `Write`, `Edit`, `apply_patch`, or directory creation on `canon/...` note paths.
3. For creation, use `obsidian create path="canon/<project>/<domain>/<feature>.md" content="<follow templates/feature-note-template.md>" overwrite`.
4. For updates, run `obsidian read path="canon/<project>/<domain>/<feature>.md"` first, then rewrite with `obsidian create ... overwrite`.
5. If `obsidian` or the canon helper scripts cannot be used, stop and report the failure instead of falling back to local file tools.

## Claim / Handoff Flow (Deterministic)

1. Read the existing note with `obsidian read path="canon/<project>/<domain>/<feature>.md"`.
2. For claim/update, confirm ownership rules, then update `feature_state`, `owner_session`, `owner_agent`, `claimed_at`, `updated_at`, the affected `Task Register` entry, and `Status History` in one `obsidian create ... overwrite` call.
3. For handoff, preserve current task state, append a handoff history entry, then update ownership fields deliberately in one `obsidian create ... overwrite` call.
4. Re-read the note after each claim or handoff write to verify the change landed as expected.

Project auto-detection in `init.sh`:

1. `OPENCODE_PROJECT_DIR` basename (if set)
2. Git repository root basename
3. Current directory basename

## Core Rules

- Search first, read second.
- Start all discovery from `path="canon"` and narrow to `canon/<project>` for active work.
- Canon notes live in Obsidian, not the workspace. Never create or edit `canon/...` with local filesystem tools; use `obsidian search/read/create` or the helper scripts.
- If `obsidian` or helper scripts are unavailable, stop with an error. Never fall back to `mkdir`, `apply_patch`, `Write`, or other workspace file creation for canon notes.
- For load-only flows, prefer `/canon init` or a 2-4 command sequence; expand only when actively updating a feature note.
- Re-read a feature note immediately before any write.
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

- `scripts/init.sh` for `/canon init` bootstrap
- `scripts/search.sh` for path-scoped search
- `REFERENCE.md`
- `references/commands.md`
- `references/flow.md`
- `references/search-syntax.md`
- `templates/feature-note-template.md`
