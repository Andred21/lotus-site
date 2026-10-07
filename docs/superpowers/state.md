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
next_action: retomar_apos_janela_do_log
resume_state: executing
context_packet: null
active_spec: docs/superpowers/specs/2026-10-05-7.2.6-observabilidade-minima-design.md
active_plan: docs/superpowers/plans/2026-10-06-7.2.6-observabilidade-minima.md
executor: claude
reviewer: codex
reviewer_exception: null
blocker: 'Portão da janela do access log (Task 4, Step 1). A leitura do log (Task 4, Steps 2 a 4) só roda a partir de 2026-10-07T12:52:18Z (09:52 no relógio de João), 24 h depois do CREATE_COMPLETE do stack lotus-observabilidade (2026-10-06T12:52:18.578Z; spec §5, passo 5); até lá não há o que fazer. Pendência de João antes de retomar: a chave do perfil AWS lotus deixou de valer — aws sts get-caller-identity responde InvalidClientTokenId desde 2026-10-07T00:50Z, com ~/.aws/credentials inalterado desde 2026-09-04, o que aponta para chave desativada ou removida do lado da AWS; a leitura do log precisa de uma credencial válida no perfil lotus, com as mesmas leituras. A Task 3 fechou em 659b9b8: stack implantado, assinatura confirmada, os dois alarmes provados por e-mail e as variáveis AWS_ALERT_ROLE_ARN e AWS_ALERT_TOPIC_ARN criadas por João no corporativo. /executar-site 7.2.6 retoma no Step 2 desta task.'
supervised_cycles_completed: 20
last_completed_work_item: 7.2.5
state_basis_commit: 659b9b8
updated_at: 2026-10-07T00:52:42Z
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
