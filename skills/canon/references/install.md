# Canon Template Install Guide

Use this guide when the user wants an Obsidian Templates note for canon feature work.

This reference is based on the official Obsidian Templates core plugin behavior:

- Templates is a core plugin.
- The user must set a template folder in Settings -> Core plugins -> Templates -> Template folder location.
- A template is a normal note stored in that folder.
- Useful built-in variables include `{{title}}`, `{{date}}`, and `{{time}}`.
- Inserting a template merges properties into the active note.

## Recommended Setup

1. Enable the Templates core plugin in Obsidian.
2. Choose a template folder, for example `templates/` inside the vault.
3. Create `templates/canon-feature.md`.
4. Start from `../templates/feature-note-template.md`.
5. Replace placeholders with Template variables only where they help.

## Recommended Shape

Keep the core canon sections from `../templates/feature-note-template.md`, especially frontmatter, `Overview`, `Acceptance Criteria`, `Working Plan`, `Task Register`, and `Status History`. Add `Mermaid Context Map` when the note needs embedded context visualization.

For a user-authored Obsidian template note, a minimal starter looks like this:

````md
---
name: "{{title}}"
project: "<project_name>"
domain: "<domain_name>"
feature_state: "todo"
owner_session: ""
owner_agent: ""
claimed_at: ""
updated_at: "<timestamp>"
tags:
  - canon
  - project/<project_name>
  - domain/<domain_name>
---

# {{title}}

## Overview
<spec_context>

## Acceptance Criteria
- <criterion>

## Working Plan
- Draft plan: <initial plan>
- Verification: <checked against memory, canon scope, and current repo state>
- Final plan: <approved execution plan>

## Task Register
- `TASK-001 | state=todo | owner_session=unassigned | <task description> | updated_at=<timestamp>`

## Status History
- `<timestamp> | <session> | created feature | initialized note`
````

Optional additions:

- Add `## Mermaid Context Map` when the note needs embedded context visualization.
- Add `## CLI Tasks` checkbox lines only when the user wants `obsidian tasks` / `obsidian task` convenience.

## Usage Notes

- `Task Register` is the source of truth for canon task state.
- For complex work, one active canon task note should anchor the session.
- `{{title}}` resolves to the current note title when the template is inserted.
- `{{date}}` and `{{time}}` can replace `<timestamp>` if the user wants generated values.
- If the user wants automatic new-note-from-template behavior, point them to `Daily notes` or `Unique note creator` rather than Templates alone.

## Related References

- [commands.md](./commands.md)
- [flow.md](./flow.md)
- [search-syntax.md](./search-syntax.md)
