# Contributing to orqly

Thanks for helping out. This repo uses **GitHub Flow**: `main` is always
deployable, and all work happens on short-lived branches merged via pull
request. There is no `develop` or `release` branch.

## Workflow

1. **Fork** (external) or **branch** (maintainer) off the latest `main`.
2. Name the branch by type: `feat/…`, `fix/…`, `chore/…`, `docs/…`, `refactor/…`.
   e.g. `feat/graphql-import`, `fix/otp-autoverify`.
3. Commit in [Conventional Commits](https://www.conventionalcommits.org) style —
   `type: summary` (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `ci:`).
4. Open a PR against `main`. Keep it focused; one concern per PR.
5. CI (lint + type-check) must pass and the PR needs a review before merge.
6. Prefer **Squash and merge** so `main` stays one commit per change.

`main` is protected: no direct pushes, no force-push, no deletion — everything
lands through a PR.

## Before you push

```sh
npm run lint       # eslint
npx tsc --noEmit   # type-check
```

Both run in CI too. After any change to `src/db/schema.ts`, run
`npx drizzle-kit push` against your local database.

## Scope

- Keep changes minimal and typed.
- Open an issue before starting a large feature, so we can agree on the shape.
- Non-trivial logic should ship with a small self-check.

## Reporting bugs / requesting features

Use the issue templates. For security issues, **do not** open a public issue —
see [SECURITY.md](SECURITY.md).
