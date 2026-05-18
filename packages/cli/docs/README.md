# CLI reference docs

Short, factual reference material. For conventions, command catalog, and dev workflow see [`../CLAUDE.md`](../CLAUDE.md).

| Doc                                                                    | What it covers                                                    |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [`ARCHITECTURE-JOURNAL-STORAGE.md`](./ARCHITECTURE-JOURNAL-STORAGE.md) | ADR — why journal files are markdown + YAML frontmatter, not JSON |
| [`sync.md`](./sync.md)                                                 | Hash-based three-way sync algorithm                               |
| [`cold-start-handling.md`](./cold-start-handling.md)                   | `ColdStartAwareSpinner` pattern for Render free-tier cold starts  |
| [`token-expiration-handling.md`](./token-expiration-handling.md)       | JWT expiration strategies in CLI tools                            |
| [`path_resolution.md`](./path_resolution.md)                           | How `papyrus` vs `paper` bin names resolve via `PATH` across OSes |
| [`RELEASE-WORKFLOW.md`](./RELEASE-WORKFLOW.md)                         | Tag → npm publish flow                                            |
