# Canon Search + CLI (Concise)

Compact search guidance for `canon` usage.

## 1) Query grammar

- `A B` means AND.
- `A OR B` means OR.
- `-A` excludes matches.
- Parentheses are supported: `(A OR B) C`.

## 2) Property queries

- `[property]` => notes that have the property.
- `[property:value]` => notes where property matches value.
- Useful examples: `[feature_state:in_progress]`, `[project:labs]`, `[owner_session:ses_abc123]`.

## 3) Path queries

- Use `path:` to filter inside the `canon` tree.
- Example: `path:canon/labs`, `path:canon/mobile/auth`.

## 4) CLI search parameters

- `obsidian search query="..."` is required.
- Optional: `path=`, `format=`, `limit=`, `case`, `total`.
- Use query-first style for consistency in this repo.

## 5) Recommended patterns for this skill

```bash
obsidian search query="path:canon/<project>" path="canon" format=json
obsidian search query="[feature_state:todo] path:canon/<project>" path="canon" format=json
obsidian search query="[feature_state:in_progress] path:canon/<project>" path="canon" format=json
obsidian search query="[owner_session:<session>] path:canon/<project>" path="canon" format=json
```

## 6) Why this shape

- Path-first queries align with the canonical layout `canon/<project>/<domain>/<feature>.md`.
- Property queries keep ownership and state filtering precise.
- `path="canon"` keeps retrieval focused and low-noise.

## 7) Canonical properties

- `feature_state`
- `owner_session`
- `owner_agent`
- `claimed_at`
- `updated_at`
- `project`
- `domain`

Do not encode ownership or state only in tags.
