# Repository guidance for coding agents

## Changesets

Author release notes with `npm run changesets:add` and follow the CLI prompts.
Do not write `.changeset/*.md` fragments by hand. The repository agent hook
blocks direct edits and points to the npm script.

Write agent hooks in TypeScript. Do not add Bash or Python hook files.
Shared agent hook policies and the common handler live in `.agents/hooks/`.
Keep `.claude` and `.codex` hook configurations as registrations only; add
hook behavior to the shared handler and policy modules.

Run `npm run check:agent-hook-policy` to reject Bash/Python hook files and
`npm run tsc:agent-hooks` to type-check agent hooks. Both checks run in
`npm run static`; type checking also runs in `npm run tsc`.
Run `npm run eslint:agent-hooks` and `npm run prettier:agent-hooks` to check
hook code against the repository's lint and format rules. Both checks run in
`npm run static`. `lint-staged` applies ESLint and Prettier to staged `.ts` and
`.tsx` files.
