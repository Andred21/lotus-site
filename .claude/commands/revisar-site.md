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

## Teste do Codex

Com executor diferente de `codex` e reviewer `codex` ou `claude-isolado`, antes de transicionar
para `reviewing`, teste o Codex pelo mesmo caminho da delegação, com a config do usuário e sem `-m`:

```bash
R=$(mktemp)
timeout 120 codex exec --sandbox read-only -o "$R" "Responda apenas a palavra: disponivel" >/dev/null 2>"$R.err"
S=$?
if [ "$S" -eq 0 ] && grep -qi disponivel "$R"; then echo "codex: disponível"; else echo "codex: indisponível (saída $S)"; grep -m1 -i error "$R.err"; fi
```

Leia só o arquivo de `-o`: o log ecoa o pedido. Disponível => `reviewer: codex`; indisponível =>
`reviewer: claude-isolado`. Quando o resultado muda o reviewer gravado, a troca entra no `chore` da
transição para `reviewing`, com a linha decisiva do erro no corpo. Reviewer `claude` com
`reviewer_exception`, ou escolhido à mão por João no plano, não é tocado pelo teste.

## Revisor

- executor Codex / reviewer Claude: Claude revisa diff, spec, plano, packet e rules.
- executor Claude / reviewer Codex: delegue `site-review-task` por
  `codex exec --sandbox read-only -o <relatório> "<contrato na íntegra + entrada>"`; depois Claude
  verifica cada achado material no código antes de aceitá-lo.
- executor Claude / reviewer `claude-isolado`: abra um agente novo pela ferramenta de agente do
  Claude Code, tipo `general-purpose`, nunca fork, sem trocar modelo. O pedido é o conteúdo de
  `.agents/skills/site-review-task/SKILL.md` na íntegra mais a entrada que o contrato define, e
  nada mais: nem resumo da execução, nem hipótese, nem memória, nem nota de review anterior. Grave
  `git status --short` antes e compare depois; diferença descarta a review, que é refeita. Depois
  Claude verifica cada achado material no código antes de aceitá-lo.
- mesmo agente nos dois papéis: só com `reviewer_exception` declarada no estado, autorizada por
  João, e débito correspondente no backlog. A review acontece, mas não vale como lente
  independente; o débito registra isso.

Review não é auditoria do repositório. Não inclua refactor adjacente.

A base da review é a branch do bloco: `git log --oneline main..HEAD` e `git diff main...HEAD`.
Confirme um commit por EAP, mensagem no padrão Conventional Commits e ausência de commit em `main`.
Commit faltando para uma EAP entregue é achado `blocking`.

Confirme também que cada transição de `state.md` segue a regra de commit de transição de
`CLAUDE.md` §4. Violação é `suggestion`: histórico revisado não é reescrito.

Classifique achados como `blocking`, `important` ou `suggestion`.

- blocking: deve ser corrigido no mesmo work item;
- important que exige decisão: `blocked`, `resume_state: reviewing`, `next_owner: joao`;
- suggestion: não entra automaticamente no escopo.

Depois de correções aprovadas, repita somente gates afetados. Review limpo => `ready_for_closure`, `next_owner: claude`, `next_action: close_active_work_item`.

Não feche automaticamente.
