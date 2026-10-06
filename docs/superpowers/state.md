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
next_action: confirmar_assinatura_do_sns
resume_state: executing
context_packet: null
active_spec: docs/superpowers/specs/2026-10-05-7.2.6-observabilidade-minima-design.md
active_plan: docs/superpowers/plans/2026-10-06-7.2.6-observabilidade-minima.md
executor: claude
reviewer: codex
reviewer_exception: null
blocker: 'Portão da confirmação da assinatura (Task 3, Step 5). Stack lotus-observabilidade em CREATE_COMPLETE desde 2026-10-06T12:52:18Z (execute por Claude às 12:51:55Z, autorizado por João neste passo). Às 12:56:46Z a assinatura email do tópico arn:aws:sns:us-east-1:760144413534:lotus-site-alertas segue PendingConfirmation (destinatário jv***@gmail.com). Os dois alarmes em OK, os seis checadores com 200, a entrega do log com 12 campos e as quatro consultas criadas. João: tocar em "Confirm subscription" no e-mail AWS Notification - Subscription Confirmation, remetente no-reply@sns.amazonaws.com, chegado às 12:52Z; procurar no spam antes de concluir que não veio; o link vale 48 h, até cerca de 2026-10-08T12:52Z — passado o prazo, o SNS apaga a assinatura pendente e a volta pede substituir o recurso, decisão de João. Nenhum passo de prova começa antes. Editado e não commitado: docs/infra/evidencia-observabilidade-2026-10-06.md (§1).'
supervised_cycles_completed: 20
last_completed_work_item: 7.2.5
state_basis_commit: c63ba9f
updated_at: 2026-10-06T12:57:29Z
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
