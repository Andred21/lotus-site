---
name: site-execute-task
description: Execute only an approved lotus-site plan delegated to Codex, within explicit authorized paths, and return an auditable report.
---

# Site Execute Task

Require: work item, base ref/commit and `authorized_paths`.
Read `AGENTS.md`, `CLAUDE.md`, `state.md`, packet and only matching rules.
Require `workflow_state: executing` or caller-declared transition from `ready_for_execution`.
Require `executor: codex`.

On unmet precondition, or a needed path outside `authorized_paths`, return the Output template below with the reason stated under `## Deviations and limitations` and `RECOMMENDED_TRANSITION: blocked`.

Execution source depends on `work_class`:
- `architectural`: require `plan_path` and follow the approved plan;
- `bounded`: require the short approved `bounded_design`; `active_plan` must remain null. Do not invent a plan document.

Rules:
- follow the architectural plan task by task, or the bounded approved design when `work_class: bounded`;
- do not replan or redesign;
- modify only `paths_autorizados`;
- preserve WIP;
- run only verification commands required by plan/CLAUDE;
- do not alter `state.md` or external systems;
- do not push, merge or create PR.

Return exactly:

BEGIN SITE EXECUTION REPORT
## Work item
## Tasks
## Files touched
## Commands run
## Acceptance evidence
## Deviations and limitations
END SITE EXECUTION REPORT
RECOMMENDED_TRANSITION: ready_for_review|blocked
