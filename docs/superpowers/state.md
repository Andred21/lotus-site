---
schema_version: 1
workflow_mode: supervised
workflow_state: blocked
work_class: architectural
active_work_item: 7.2.6
active_notion_eap: 7.2.6
active_title: Configurar observabilidade mínima pós-go-live (bloco `B6`)
active_branch: feat/7-2-6-observabilidade-minima
bounded_design: null
authorized_paths: null
next_owner: joao
next_action: decidir_gatilho_do_d66
resume_state: reviewing
context_packet: null
active_spec: docs/superpowers/specs/2026-10-05-7.2.6-observabilidade-minima-design.md
active_plan: docs/superpowers/plans/2026-10-06-7.2.6-observabilidade-minima.md
executor: claude
reviewer: claude
reviewer_exception: 'Autorizado por João em 2026-10-11: cota da conta Codex esgotada, Claude executa e revisa o bloco. Sem segunda lente independente; débito D-70.'
blocker: 'Achado R-3 da review (important, exige decisão): a spec de 7.2.6, §10, dá a D-66 o gatilho novo "decisão de João sobre a correção, com a medição na mão". O backlog (D-66) grava outro: "lotus-site/latencia-por-borda com tráfego do Chile que valha medir, e decisão de João sobre a correção, com a medição na mão" — condição acrescentada pelo executor porque a primeira medição tem um único pedido do Chile em cinco dias (evidência §7), sem decisão de João. Decisão de João: (a) aceitar o gatilho do backlog, registrado como desvio aceito por ele; ou (b) voltar ao texto da spec. Blocking R-1 (5 dias, não 4, na §6), R-6 (divisão Hit/RefreshHit/Miss é de todos os países) e o limite do registro de scanner (R-2) já corrigidos em da739cc. Gates: pnpm check exit 0 em f91f0a4 (42 arquivos, 426 testes); check do corporativo na árvore filtrada exit 0 (35 arquivos, 372 testes).'
supervised_cycles_completed: 20
last_completed_work_item: 7.2.5
state_basis_commit: da739cc
updated_at: 2026-10-11T15:40:50Z
---

# Estado operacional — Lotus Site

> Fonte única da fase atual. Histórico, Notion, commits e existência de arquivos não promovem trabalho.

## Estados válidos

| Estado                | Próxima ação permitida                         |
| --------------------- | ---------------------------------------------- |
| `idle`                | selecionar explicitamente um work item         |
| `context_required`    | gerar/atualizar Context Packet                 |
| `ready_for_planning`  | iniciar planejamento                           |
| `planning`            | continuar brainstorming/spec/plano             |
| `ready_for_execution` | iniciar execução do plano                      |
| `executing`           | continuar somente o plano ativo                |
| `ready_for_review`    | iniciar revisão independente                   |
| `reviewing`           | continuar review/correções aprovadas           |
| `ready_for_closure`   | executar fechamento                            |
| `blocked`             | resolver `blocker` e retornar a `resume_state` |

## Invariantes

- Existe no máximo um `active_work_item`.
- Todo estado diferente de `idle` tem `active_branch` preenchida e diferente de `main`;
  a branch nasce em `/planejar-site` e morre no PR aberto por `/fechar-site`.
- `work_class` é `bounded` ou `architectural` a partir de `ready_for_execution`; em `planning` ainda pode ser `null`.
- `architectural` exige `active_spec` e `active_plan` antes de `ready_for_execution`.
- `bounded` mantém `active_spec` e `active_plan` nulos e persiste apenas `bounded_design` curto + `authorized_paths`.
- `executor` e `reviewer` devem ser diferentes a partir de `ready_for_execution`. Agente
  indisponível é exceção declarada, não silenciosa: `reviewer_exception` carrega motivo, data e
  quem autorizou, e o desvio vira débito no backlog. Sem ela, agente igual nos dois papéis é erro
  de `pnpm agent:check`; com executor e reviewer diferentes, o campo precisa estar limpo.
- `context_packet` é obrigatório quando o trabalho depende de fonte externa.
- Work item, Context Packet, spec e plano devem apontar para o mesmo escopo.
- Claude é o único escritor deste arquivo pelo contrato do harness.
- Nenhum agente seleciona automaticamente o próximo item.
- Divergência operacional leva a `blocked`; não reconstrua a fase por heurística.
- Toda escrita neste arquivo carimba `updated_at` e `state_basis_commit`.
