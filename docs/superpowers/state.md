---
schema_version: 1
workflow_mode: supervised
workflow_state: blocked
work_class: architectural
active_work_item: 7.2.3+7.2.4
active_notion_eap: 7.2.3+7.2.4
active_title: Backup e rollback do WordPress antes do corte; smoke test completo em produção (bloco `B4`)
active_branch: feat/7-2-3-7-2-4-backup-smoke-test
bounded_design: null
authorized_paths: null
next_owner: joao
next_action: executar_estagio_5
resume_state: executing
context_packet: null
active_spec: docs/superpowers/specs/2026-09-28-7.2.3-7.2.4-backup-rollback-smoke-design.md
active_plan: docs/superpowers/plans/2026-09-29-7.2.3-7.2.4-backup-rollback-smoke.md
executor: claude
reviewer: codex
reviewer_exception: null
blocker: 'Portão humano do plano, Task 11 Step 3: executar o change set do estágio 5 do lotus-dns (arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791147529/036a6104-5121-4326-a315-50be4fe34afb; uma linha, Modify Registros False; o diff antes/depois por nome e tipo tira só ensaio-corte A/AAAA, de 23 para 21 registros; apex e www intactos; corpo igual ao template de 543b927, salvo duas linhas de comentário com ?). O 4c passou (desfecho 1, fc5733e): o stack está em UPDATE_COMPLETE com o template do WordPress, o mesmo que a zona tem. Como no 4b e no 4c, João roda o estagio-5.sh do scratchpad desta sessão, que confere change set, corpo, stack e template, zona, drift, a premissa na API, os 27 RRsets, amostragem e aquecimento antes do execute, e mede --esperado ausente --limite 3900 (até cerca de 70 min). Template de 543b927 e INVENTARIO sem ensaio-corte (21 linhas, 72 testes) não commitados; vão no commit da Task 11. Tasks 15–17 seguem com autorização própria a cada passo.'
supervised_cycles_completed: 18
last_completed_work_item: 7.2.2
state_basis_commit: fc5733e
updated_at: 2026-10-04T21:02:29Z
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
