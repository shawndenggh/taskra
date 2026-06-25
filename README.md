# taskra

taskra is an Agent harness project built from zero.

The goal is simple: make agent work inspectable. A taskra run should show what was requested, what context was used, which tools ran, what changed, and why the result should be trusted.

## Principles

- Keep the core small.
- Make every run auditable.
- Treat tools as explicit capabilities.
- Prefer local-first storage before hosted infrastructure.
- Do not pretend deterministic code is AI.

## Development Workflow

Start with a clear target, then build the smallest useful slice.

For meaningful changes:

1. Clarify the outcome.
2. Write down the expected behavior.
3. Add or update tests.
4. Implement the smallest working version.
5. Verify before calling it done.

## First Milestone

Persist agent run logs locally.

The first version should record:

- Input task
- Loaded context
- Tool calls
- Tool results
- Events
- Final output
- Failure details

Do not start with a database. Start with readable local files, then move to SQLite when querying and concurrency actually matter.

## Status

This repository is at bootstrap stage.
