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
next_action: executar_change_set_da_prova_do_health_check
resume_state: executing
context_packet: null
active_spec: docs/superpowers/specs/2026-10-05-7.2.6-observabilidade-minima-design.md
active_plan: docs/superpowers/plans/2026-10-06-7.2.6-observabilidade-minima.md
executor: claude
reviewer: codex
reviewer_exception: null
blocker: 'Portão da prova do health check (Task 3, Step 8), com divergência do plano. Change set criado e lido, não executado: arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791291722/0b10cf7e-85ae-456d-93aa-69331cc777f0 (stack lotus-observabilidade, us-east-1; só o override CaminhoDaSonda=/prova-b6-inexistente). Diff por propriedade: uma linha, a esperada — SaudeDoSite /Properties/HealthCheckConfig/ResourcePath: "/" -> "/prova-b6-inexistente". Divergência: a tabela do plano (describe-change-set sem --include-property-values) veio com duas linhas — Modify AlarmeDeSaude Substituicao False e Modify SaudeDoSite Substituicao Conditional —, e o plano esperava uma, Modify SaudeDoSite False; pela regra do plano, recurso fora do esperado para o fluxo sem executar. Leitura de Claude: sem os valores, a CloudFormation avalia HealthCheckConfig inteira (RequiresRecreation Conditionally) e lista o AlarmeDeSaude só como consequência dinâmica do !Ref SaudeDoSite; com --include-property-values, a mudança é uma só, ResourcePath com RequiresRecreation Never e SaudeDoSite Replacement False; o schema de AWS::Route53::HealthCheck dá como create-only só Type, MeasureLatency e RequestInterval. Recomendação: executar. Depois do UPDATE_COMPLETE, Claude confere que o IdDoHealthCheck continua 28047618-872b-4a39-90d9-3e1ff6d1ed53 e que os eventos não tocaram o AlarmeDeSaude. Esperado: o AlarmeDeSaude em ALARM alguns minutos depois e um e-mail ALARM: "lotus-site-indisponivel"; o site não muda para o visitante. Editado e não commitado: docs/infra/evidencia-observabilidade-2026-10-06.md (§1, §2 e §3.1). Executar é de João, ou de Claude com autorização explícita neste passo.'
supervised_cycles_completed: 20
last_completed_work_item: 7.2.5
state_basis_commit: fda436c
updated_at: 2026-10-06T13:04:11Z
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
