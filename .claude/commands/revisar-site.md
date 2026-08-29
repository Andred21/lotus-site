---
description: Revisa o work item ativo com agente independente
argument-hint: [work-item]
disable-model-invocation: true
---

@docs/superpowers/state.md

# Revisar Site — $ARGUMENTS

Leia `state.md` primeiro. Aceite somente `ready_for_review` ou `reviewing` e o mesmo work item.

Em `blocked` com `resume_state` igual a `ready_for_review` ou `reviewing` e `blocker` resolvido por João, restaure `workflow_state` para `resume_state`, limpe `blocker` e `resume_state`, e prossiga.

Ao iniciar, transicione para `reviewing`.

- executor Codex / reviewer Claude: Claude revisa diff, spec, plano, packet e rules.
- executor Claude / reviewer Codex: delegue `site-review-task`; depois Claude verifica cada achado material no código antes de aceitá-lo.
- mesmo agente nos dois papéis: só com `reviewer_exception` declarada no estado, autorizada por João, e débito correspondente no backlog. A review acontece, mas não vale como lente independente; o débito registra isso.

Review não é auditoria do repositório. Não inclua refactor adjacente.

A base da review é a branch do bloco: `git log --oneline main..HEAD` e `git diff main...HEAD`.
Confirme um commit por EAP, mensagem no padrão Conventional Commits e ausência de commit em `main`.
Commit faltando para uma EAP entregue é achado `blocking`.

Classifique achados como `blocking`, `important` ou `suggestion`.

- blocking: deve ser corrigido no mesmo work item;
- important que exige decisão: `blocked`, `resume_state: reviewing`, `next_owner: joao`;
- suggestion: não entra automaticamente no escopo.

Depois de correções aprovadas, repita somente gates afetados. Review limpo => `ready_for_closure`, `next_owner: claude`, `next_action: close_active_work_item`.

Não feche automaticamente.
