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
next_action: executar_change_set_do_stack_de_observabilidade
resume_state: executing
context_packet: null
active_spec: docs/superpowers/specs/2026-10-05-7.2.6-observabilidade-minima-design.md
active_plan: docs/superpowers/plans/2026-10-06-7.2.6-observabilidade-minima.md
executor: claude
reviewer: codex
reviewer_exception: null
blocker: 'Portão do stack de observabilidade (Task 3, Step 3). Change set de criação criado e lido, não executado: arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791288770/f4994f08-b9c3-407e-92cf-695630d53269 (stack lotus-observabilidade, us-east-1, destinatário jv***@gmail.com). Tabela: catorze linhas, todas Add — Acessos (AWS::Logs::LogGroup), Alarme5xx e AlarmeDeSaude (AWS::CloudWatch::Alarm), Assinatura (AWS::SNS::Subscription), Consulta5xx, ConsultaCache, ConsultaLatencia e ConsultaReleases (AWS::Logs::QueryDefinition), DestinoDoLog (AWS::Logs::DeliveryDestination), EntregaDoLog (AWS::Logs::Delivery), OrigemDoLog (AWS::Logs::DeliverySource), PapelDeAlerta (AWS::IAM::Role), SaudeDoSite (AWS::Route53::HealthCheck) e Topico (AWS::SNS::Topic). Nenhum arquivo editado e não commitado. João: executar o change set (aws cloudformation execute-change-set --region us-east-1 --change-set-name <ARN acima>, com AWS_PROFILE=lotus), esperar o CREATE_COMPLETE (aws cloudformation wait stack-create-complete --region us-east-1 --stack-name lotus-observabilidade) e clicar no link do e-mail de confirmação do SNS — remetente no-reply@sns.amazonaws.com; procurar no spam antes de concluir que não veio; o link vale 48 h. Executar é de João, ou de Claude com autorização explícita neste passo; a confirmação da assinatura é sempre de João.'
supervised_cycles_completed: 20
last_completed_work_item: 7.2.5
state_basis_commit: 18621d4
updated_at: 2026-10-06T12:13:15Z
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
