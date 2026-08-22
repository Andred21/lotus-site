---
description: Executa somente o plano ativo do Lotus Site
argument-hint: [work-item]
disable-model-invocation: true
---

@docs/superpowers/state.md

# Executar Site — $ARGUMENTS

Leia `state.md` primeiro. Aceite somente `ready_for_execution` ou `executing`, para o mesmo `active_work_item`.

Antes de tocar código, exija coerência entre `work_class`, contexto e árvore Git, além de executor/reviewer diferentes.

- `architectural`: exija `active_spec` e `active_plan`;
- `bounded`: exija `active_spec: null`, `active_plan: null`, `bounded_design` e `authorized_paths`.

Divergência => `blocked`.

Ao iniciar, mova para `executing` com `next_owner: claude` e `next_action: continue_active_plan` no primeiro artefato durável da execução.

Use a técnica Superpowers indicada pelo plano.

- `executor: claude` => Claude executa o plano.
- `executor: codex` => delegue `site-execute-task` com work item, base commit e `authorized_paths`; inclua `plan_path` em architectural ou `bounded_design` em bounded.

Depois de delegação Codex, Claude deve executar `git status --short` e revisar o `git diff` real contra plano e paths. Relatório não substitui diff.

Rode as verificações do plano. Se tasks e critérios previstos estiverem provados, atualize para `ready_for_review`, `next_owner` igual ao reviewer e `next_action: review_active_work_item`.

Não inicie review automaticamente.
