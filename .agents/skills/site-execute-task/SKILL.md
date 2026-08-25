---
name: site-execute-task
description: Execute only an approved lotus-site plan delegated to Codex, within explicit authorized paths, and return an auditable report.
---

# Site Execute Task

## Preconditions

- `workflow_state: executing`, or a transition from `ready_for_execution` explicitly declared by the
  caller;
- `executor: codex`;
- one explicit work item;
- `work_class` stated;
- when `architectural`: `plan_path` to the approved plan;
- when `bounded`: the short approved `bounded_design`. `active_plan` stays `null` and no plan
  document is invented;
- base ref and base commit;
- a closed `authorized_paths` list.

Read `AGENTS.md`, `CLAUDE.md`, `docs/superpowers/state.md`, the context packet when present, and the
plan or bounded design.

On an unmet precondition, or when a needed path falls outside `authorized_paths`, return the Output
template with the reason under `## Deviations and limitations` and `RECOMMENDED_TRANSITION: blocked`.

## Preflight

Run and record the real output before the first edit:

```bash
git status --short
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
```

Work in progress that belongs to someone else is preserved. Nothing is reverted, stashed, cleaned or
checked out over.

## Prohibitions

- do not replan, redesign or widen scope;
- do not touch any path outside `authorized_paths`;
- do not modify `docs/superpowers/state.md`;
- do not edit `CLAUDE.md`, `AGENTS.md`, `.claude/**` or `.agents/**` — the harness contract is
  outside Codex's reach;
- do not write to Notion, Google Drive or Figma;
- do not publish the branch, open a pull request, merge, run a destructive rebase or delete a branch;
- do not install a dependency the plan does not require.

## Code

Before editing a file, load the rules in `.claude/rules/` whose `paths` match it, and obey them.
Follow the plan task by task, in order; when `work_class: bounded`, follow the approved bounded
design instead.

## TDD

When the change has testable behaviour and a test runner is configured, work `red → green →
refactor` and record the real output of each run. A purely documentation or configuration change does
not fabricate a test; its proof is the real output of the affected command.

## Evidence

Each delivered task carries objective proof: the command executed with its real output, or the diff
of the file. A claim without output is not evidence.

## Deviations

- report only, when the difference is a matter of form and changes no contract;
- block, when the plan is wrong, a required path is not authorized, or a gate fails;
- require a new decision from João, when the fix implies a product or architecture choice.

## Output

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

Before returning, confirm: every plan task is covered; no path outside `authorized_paths` was
touched; every command reported carries real output; every deviation is declared; the state file was
not modified.
