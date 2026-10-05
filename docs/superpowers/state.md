---
schema_version: 1
workflow_mode: supervised
workflow_state: blocked
work_class: architectural
active_work_item: 7.2.5
active_notion_eap: 7.2.5
active_title: Realizar cutover do lotusotec.cl para o novo site (bloco `B5`)
active_branch: feat/7-2-5-cutover-lotusotec
bounded_design: null
authorized_paths: null
next_owner: joao
next_action: executar_change_set_ttl_do_corte
resume_state: executing
context_packet: null
active_spec: docs/superpowers/specs/2026-10-04-7.2.5-cutover-lotusotec-design.md
active_plan: docs/superpowers/plans/2026-10-04-7.2.5-cutover-lotusotec.md
executor: claude
reviewer: claude
reviewer_exception: 'Autorizado por João em 2026-10-05: cota da conta Codex esgotada, Claude executa e revisa o bloco. Sem segunda lente independente; débito D-65.'
blocker: 'Portão do TTL do corte (Task 5, Step 10). Change set criado e lido, não executado: arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791195680/efe64cb0-01ec-4038-864c-26bb7f6df9a9 (stack lotus-dns, us-east-1). Tabela: uma linha, Modify Registros Substituicao False. Diff por Name e Type: lotusotec.cl. A, lotusotec.cl. AAAA, www.lotusotec.cl. A e www.lotusotec.cl. AAAA, só TTL 3600 -> 60, valores do WordPress. Editados e não commitados: scripts/infra/zona.test.mjs, scripts/infra/lib/zona.mjs, infra/lotus-dns.yaml, infra/rollback-corte.json, docs/infra/rollback-corte.md. O corte só acontece 3600 s depois do UPDATE_COMPLETE deste change set (T0). Executar é de João, ou de Claude com autorização explícita neste passo.'
supervised_cycles_completed: 19
last_completed_work_item: 7.2.3+7.2.4
state_basis_commit: 23c7d97
updated_at: 2026-10-05T10:25:00Z
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
