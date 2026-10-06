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
next_action: executar_volta_do_health_check_e_prova_do_5xx
resume_state: executing
context_packet: null
active_spec: docs/superpowers/specs/2026-10-05-7.2.6-observabilidade-minima-design.md
active_plan: docs/superpowers/plans/2026-10-06-7.2.6-observabilidade-minima.md
executor: claude
reviewer: codex
reviewer_exception: null
blocker: 'Portão da volta do health check e da prova do 5xx (Task 3, Step 12). Change set da volta criado e lido, não executado: arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791293693/d7f446b4-b9fb-4bcf-934c-ed1ec6d8fff6 (stack lotus-observabilidade, us-east-1; só o override explícito CaminhoDaSonda=/). Diff por propriedade: uma linha, a esperada — SaudeDoSite /Properties/HealthCheckConfig/ResourcePath: "/prova-b6-inexistente" -> "/". Tabela do plano: as mesmas duas linhas da prova — Modify AlarmeDeSaude Substituicao False e Modify SaudeDoSite Substituicao Conditional —, contra uma esperada; com --include-property-values, uma mudança, Replacement False, ResourcePath RequiresRecreation Never. O Step 9 provou que esse formato atualiza no lugar: o execute da prova (13:30:48Z, UPDATE_COMPLETE 13:30:55Z) gerou eventos só do SaudeDoSite, com o mesmo físico 28047618-872b-4a39-90d9-3e1ff6d1ed53, e nenhum do AlarmeDeSaude. Recomendação: executar. Step 10 provado: lotus-site-indisponivel em ALARM às 13:34:16Z (Threshold Crossed, ponto 0.0 às 13:33), seis checadores com Failure: HTTP Status Code 404, ação SNS executada às 13:34:16Z; falta João declarar a chegada e o horário do e-mail ALARM: "lotus-site-indisponivel". Comandos de João, nesta ordem: (1) o execute deste change set, com wait stack-update-complete; (2) depois do UPDATE_COMPLETE e só com o lotus-site-5xx em OK, o set-alarm-state do Step 13 (lotus-site-5xx para ALARM, razão da prova de B6). Cada um é de João, ou de Claude com autorização explícita dada para ele. Esperados três e-mails: OK: "lotus-site-indisponivel", ALARM: "lotus-site-5xx" e, segundos depois, OK: "lotus-site-5xx"; João declara cada um e o horário. Enquanto este portão não fecha, o AlarmeDeSaude fica em ALARM e uma queda real não manda e-mail novo. Editado e não commitado: docs/infra/evidencia-observabilidade-2026-10-06.md (§1 a §3.3).'
supervised_cycles_completed: 20
last_completed_work_item: 7.2.5
state_basis_commit: 100febf
updated_at: 2026-10-06T13:37:06Z
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
