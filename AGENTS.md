# Repository guidance for coding agents

## Changesets

Author release notes with `npm run changesets:add` and follow the CLI prompts.
Do not write `.changeset/*.md` fragments by hand. The repository agent hook
blocks direct edits and points to the npm script.

Shared agent hook policies live in `.agents/hooks/`; put runtime-specific
adapters and registrations with that agent's configuration.

Type-check agent hooks with `npm run tsc:agent-hooks`; this check is included
in `npm run tsc` and `npm run static`.
