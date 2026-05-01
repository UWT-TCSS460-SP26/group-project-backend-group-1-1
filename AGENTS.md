# Agent Instructions

Conventions for AI coding agents (Claude Code, Cursor, etc.) working in this repo.

## Always run lint and formatting before pushing

CI fails the push if `prettier --check` or `eslint` finds any issue, so always run both locally before `git push`:

```bash
npm run format:check && npm run lint
```

If `format:check` reports issues, fix them with `npm run format` and re-stage. Do not push until both commands exit clean.
