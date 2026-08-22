---
name: site-review-task
description: Independently review a lotus-site work item executed by Claude against its spec, plan, diff and repository rules. Read-only.
---

# Site Review Task

Input: work item, base commit, head commit, spec path, plan path, context packet when present.
Require the active plan to name `reviewer: codex`.

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
RECOMMENDED_TRANSITION: ready_for_closure|blocked
