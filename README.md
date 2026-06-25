# taskra

taskra is a from-zero Agent harness project.

The goal is to build a harness that makes agent work inspectable, repeatable, and hard to bullshit. A good run should leave evidence: what the user asked for, what context was loaded, what tools ran, what changed, what failed, and why the final answer is trustworthy.

## Development Method

This project is designed to be built with the workflow from [mattpocock/skills](https://github.com/mattpocock/skills).

Those skills are not shell commands. They are coding-agent workflows. Use them by asking the agent to apply a named skill during development.

Example:

```text
Use grill-with-docs to clarify the run log design before implementation.
```

```text
Use tdd to implement JSON run log persistence.
```

## First-Time Setup

Install the skills into your coding agent:

```bash
npx skills@latest add mattpocock/skills
```

When selecting skills, include:

- `setup-matt-pocock-skills`
- `grill-with-docs`
- `to-prd`
- `tdd`
- `diagnosing-bugs`
- `improve-codebase-architecture`
- `triage`

Then restart the coding agent so it loads the new skills.

Run the setup skill inside this repository:

```text
Use setup-matt-pocock-skills for this repository.
```

Configure it with boring defaults unless there is a real reason not to:

- Issue tracker: GitHub issues
- Docs directory: `docs/`
- Architecture decisions: `docs/adr/`
- Product specs: `docs/prd/`

## From-Zero Project Flow

Start with thinking, not scaffolding.

1. Use `grill-with-docs` to clarify the domain, users, constraints, and vocabulary.
2. Use `to-prd` to turn the first milestone into a small PRD.
3. Use `domain-modeling` when naming gets fuzzy.
4. Use `codebase-design` before creating modules.
5. Use `tdd` for implementation.
6. Use `diagnosing-bugs` when behavior fails.
7. Use `improve-codebase-architecture` after a few features, not before the first line of code.

## Daily Workflow

For each meaningful change:

1. State the target outcome in one sentence.
2. If the outcome is unclear, use `grill-with-docs`.
3. If the work is larger than one small commit, use `to-prd`.
4. Write or update a test first with `tdd`.
5. Implement the smallest thing that passes.
6. Run the verification commands.
7. Record any design decision that will matter later.

This is the loop:

```text
clarify -> specify -> test -> implement -> verify -> document
```

Skipping steps is allowed only when the change is truly tiny. "I am impatient" is not a reason.
