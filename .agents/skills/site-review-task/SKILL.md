---
name: site-review-task
description: Independently review a lotus-site work item executed by Claude against its spec, plan, diff and repository rules. Read-only.
---

# Site Review Task

Input: work item, base commit, head commit, context packet when present.
Require `docs/superpowers/state.md`'s `reviewer: codex`.

Review source depends on `work_class`:
- `architectural`: spec path and plan path;
- `bounded`: approved `bounded_design` and `authorized_paths`; `active_spec` and `active_plan` remain null.

Review only the work item diff and direct impact. Do not edit files.
Check acceptance criteria, plan compliance, regressions, unnecessary complexity, React/TypeScript/rules, missing verification and unauthorized scope.

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
