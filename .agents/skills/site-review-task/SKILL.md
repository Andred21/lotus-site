---
name: site-review-task
description: Independently review a lotus-site work item executed by Claude against its spec, plan, diff and repository rules. Read-only.
---

# Site Review Task

Input: work item, base commit, head commit, and the context packet when one exists.
Require `reviewer: codex` in `docs/superpowers/state.md`.

Review source depends on `work_class`:

- `architectural`: the spec path and the plan path;
- `bounded`: the approved `bounded_design` and `authorized_paths`; `active_spec` and `active_plan`
  remain `null`.

Review only the work item diff and its direct impact.

## Review dimensions

- **Acceptance** — was the work item's acceptance criterion actually met, proven by real output?
- **Scope** — is there any change outside the work item or outside `authorized_paths`?
- **Architecture** — were the boundaries in `.claude/rules/architecture.md` respected?
- **Componentization** — excessive responsibility, premature extraction, duplication, abstraction
  without a consumer?
- **Dependency direction** — do the imports respect the declared layers?
- **TypeScript** — `any`, unjustified cast, duplicated type, missing `type` import, representable
  invalid state, prop without a consumer?
- **React** — unnecessary effect, derivable state stored, wrong effect dependency, poor composition,
  too much logic in JSX?
- **A11y / Responsive** — when there is UI: role, accessible name, focus, `alt`, behaviour at the
  required widths.
- **Visual evidence** — required only when Playwright exists in the project. While it does not, the
  absence is recorded under `## Limitations` and never simulated.
- **Testing** — coverage proportional to the behaviour. With no runner configured, verify that no
  test was claimed.
- **Overengineering** — abstraction, wrapper, file or dependency without a consumer.

## Severity

- `blocking` — must be fixed inside this work item;
- `important` — may need a decision from João, and then blocks;
- `suggestion` — does not enter scope automatically.

## Evidence rule

Every finding cites `path:line` and the observed excerpt, separating `found` from `expected`. A
personal preference with no written rule behind it is not a finding.

## Read-only

The review edits no file, fixes nothing, runs no command that changes the working tree, and does not
touch `docs/superpowers/state.md`, `.claude/**` or `.agents/**`.

## Output

Return exactly:

BEGIN SITE REVIEW REPORT
## Verdict
PASS|FINDINGS|BLOCKED
## Findings
[R-N] <path:line> — <title>
severity: blocking|important|suggestion
found: ...
expected: ...
impact: ...
## Verification observed
## Limitations
END SITE REVIEW REPORT
RECOMMENDED_TRANSITION: ready_for_closure|reviewing|blocked
