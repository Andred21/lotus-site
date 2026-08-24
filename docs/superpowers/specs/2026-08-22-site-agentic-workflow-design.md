# Lotus Site — Agentic Development Workflow Design

**Status:** aprovado para implementação  
**Data:** 2026-08-22  
**Repositório alvo:** `Andred21/lotus-site`  
**Baseline consultada:** `main@8a02cde61d5d4c841f2c57c85e32aae5db64ed32`  
**Notion:** `Tasks · Lotus Site Institucional` — database `e60b7fa3-9988-42c9-9338-1aea10881d35`, data source `collection://2f0e72ec-ef53-4e08-a466-312de7eea7d2`

---

## 1. Contexto

`lotus-site` é a reconstrução greenfield do site institucional público da Lotus OTEC. O repositório parte de Vite + React + TypeScript e deve primeiro reproduzir o site público atual com fidelidade suficiente para estabelecer uma baseline própria. Somente depois da paridade aprovada entram redesign, melhorias de UX/UI, performance, SEO e integrações adicionais.

O repositório já possui `CLAUDE.md` gerado por `/init` e `.claude/rules/architecture.md` e `.claude/rules/testing.md`, mas as duas rules ainda estão vazias. O `CLAUDE.md` atual descreve corretamente o scaffold e os comandos existentes, porém ainda não define o produto, o workflow agentic, a hierarquia de fontes, os gates ou a divisão de responsabilidade Claude/Codex.

O objetivo desta feature é tornar o próprio repositório capaz de carregar contexto, planejar, executar, revisar e fechar trabalho sem depender de prompts produzidos em outro chat a cada etapa.

### 1.1 Divergência deliberada em relação ao roadmap do Notion

O Notion atualmente coloca o workflow de IA na Sprint 8:

- `9.1.1` — **Planejar workflow de IA sobre o projeto já estabilizado**;
- `9.1.2` — **Criar instruções de agentes específicas do site**, dependente de `9.1.1`.

A instrução explícita atual antecipa parte desse trabalho para o início do projeto. Esta antecipação é deliberada: será implementado **somente o harness mínimo supervisionado** necessário para orientar a fundação, o inventário e o clone. A automação quase autônoma continua deferida até o workflow ser provado em execuções reais.

Essa decisão não autoriza atualizar o Notion automaticamente. A divergência deve ser registrada no repositório e sincronizada externamente apenas mediante solicitação explícita.

---

## 2. Objetivos

O workflow deve:

1. permitir iniciar trabalho por identificador explícito, preferencialmente EAP do Notion;
2. reconstruir contexto seletivamente antes de planejar;
3. usar Superpowers como motor de processo, em vez de recriar brainstorming/TDD/review;
4. manter Claude Code como orquestrador e único escritor do estado operacional;
5. permitir delegação explícita ao Codex para contexto, execução mecânica e revisão independente;
6. separar planejamento, execução, revisão e fechamento em gates observáveis;
7. registrar spec, plano, Context Packet e histórico como artefatos versionados;
8. validar evidência real antes de declarar uma task concluída;
9. suportar posteriormente engenharia reversa, clone visual, comparação por screenshots e evolução de UI;
10. reduzir a necessidade de prompts manuais repetitivos.

---

## 3. Não objetivos desta primeira implementação

Não entram no bootstrap inicial:

- `/desenvolver-site` totalmente autônomo;
- alteração automática de status no Notion;
- criação automática de PR, merge, push ou exclusão de branch;
- dezenas de subagents especializados;
- hooks destrutivos ou permissões amplas;
- pipeline visual completo antes de Playwright existir no projeto;
- design system completo;
- decisão do backend/formulário de contato;
- redesign do site atual;
- replicação integral do harness do Lotus administrativo.

A primeira versão deve permanecer pequena o suficiente para ser auditável e substituível.

---

## 4. Princípios

### 4.1 Repositório como memória operacional

O conhecimento recorrente do desenvolvimento deve morar no repositório:

- `CLAUDE.md` — mapa curto da sessão, fontes, leis, comandos e workflow;
- `AGENTS.md` — contrato de entrada do Codex;
- `.claude/rules/` — convenções por responsabilidade;
- `.claude/commands/` — entradas fixas do workflow;
- `.agents/skills/` — contratos de delegação ao Codex;
- `docs/superpowers/state.md` — estado operacional atual;
- `docs/superpowers/context-packets/` — snapshots compactos de contexto;
- `docs/superpowers/specs/` — decisões de design aprovadas;
- `docs/superpowers/plans/` — planos executáveis;
- `docs/superpowers/historico/progress.md` — histórico curto de entregas.

### 4.2 Superpowers é o motor, o harness é o orquestrador

Os comandos do projeto não implementam versões próprias de brainstorming, TDD ou code review. O harness decide **quando** uma fase pode ocorrer e quais artefatos ela exige. As skills Superpowers definem **como** executar a técnica da fase.

Fluxo técnico preferencial:

`using-superpowers` → `brainstorming` quando aplicável → `writing-plans` → `subagent-driven-development` ou `executing-plans` → `test-driven-development` → `requesting-code-review` → `verification-before-completion`.

### 4.3 Um único dono do estado

Claude Code é o único agente autorizado pelo harness a alterar `docs/superpowers/state.md`. Codex pode recomendar transições em contratos de saída, mas não as aplica.

### 4.4 Evidência antes de conclusão

Relatório de agente não é prova. Claude deve conferir o diff real e executar os gates aplicáveis antes de aceitar uma recomendação de transição.

### 4.5 Seleção explícita de trabalho

Nenhum comando escolhe a próxima task por ordem do Notion, histórico, commit ou heurística. Um identificador de work item deve ser explicitamente fornecido ou já estar ativo no `state.md`.

### 4.6 Clone antes de evolução

Enquanto o modo do work item for `clone`, divergência visual em relação à referência é defeito salvo decisão registrada. Melhorias deliberadas pertencem ao modo `evolution`.

---

## 5. Hierarquia de fontes

Para decisões de requisito, arquitetura ou comportamento:

1. instrução atual e explícita do João Victor;
2. documentação canônica de planejamento no Google Drive, quando existir para o assunto;
3. referência Git solicitada ou, sem referência explícita, a branch padrão atual deste repositório;
4. Notion para organização das tasks;
5. memória/conversas somente como pistas.

O site público `https://lotusotec.cl/` é uma **fonte de referência visual e de conteúdo do clone**, não uma autoridade superior para decisões arquiteturais.

Para o banco de tasks do site, o harness deve usar o identificador estável:

`collection://2f0e72ec-ef53-4e08-a466-312de7eea7d2`

Nunca selecionar uma base apenas pelo nome de exibição.

Se fontes divergirem materialmente, o workflow entra em `blocked` e apresenta a divergência; não escolhe silenciosamente.

---

## 6. Papéis

### 6.1 João Victor

Responsável por escolher work items, aprovar design/spec quando exigido pelo Superpowers, resolver ambiguidades de produto/arquitetura, aprovar achados decisórios e autorizar escritas externas ou operações Git remotas.

### 6.2 Claude Code

Responsável por orquestrar o workflow, validar `state.md`, promover transições, conduzir brainstorming/spec/plano, escolher executor/reviewer no plano, executar quando designado, validar relatórios do Codex contra o diff e fechar o work item com evidência.

### 6.3 Codex

Agente auxiliar para Context Packet, execução mecânica com paths fechados e revisão independente de trabalho executado pelo Claude.

Codex não pode replanejar, alterar escopo, selecionar novo work item, modificar `state.md`, escrever em Notion/Drive/Figma, criar PR/merge/push nem sair dos `paths_autorizados`.

---

## 7. Estrutura inicial

```text
lotus-site/
├── CLAUDE.md
├── AGENTS.md
├── .claude/
│   ├── commands/
│   │   ├── planejar-site.md
│   │   ├── executar-site.md
│   │   ├── revisar-site.md
│   │   └── fechar-site.md
│   └── rules/
│       ├── architecture.md
│       ├── frontend.md
│       └── testing.md
├── .agents/
│   └── skills/
│       ├── site-context-packet/SKILL.md
│       ├── site-execute-task/SKILL.md
│       └── site-review-task/SKILL.md
├── docs/
│   └── superpowers/
│       ├── state.md
│       ├── context-packets/
│       ├── specs/
│       ├── plans/
│       └── historico/progress.md
└── scripts/
    └── validate-agent-workflow.mjs
```

Diretórios de artefatos nascem com artefatos reais; não usar `.gitkeep` apenas para materializar pasta vazia.

---

## 8. Estado operacional

`docs/superpowers/state.md` é a única fonte que define a fase atual.

```yaml
---
schema_version: 1
workflow_mode: supervised
workflow_state: idle
work_class: null
active_work_item: null
active_notion_eap: null
active_title: null
bounded_design: null
authorized_paths: null
next_owner: joao
next_action: select_work_item
resume_state: null
context_packet: null
active_spec: null
active_plan: null
executor: null
reviewer: null
blocker: null
supervised_cycles_completed: 0
last_completed_work_item: null
state_basis_commit: null
updated_at: null
---
```

### 8.1 Estados válidos

| Estado | Próxima ação permitida |
|---|---|
| `idle` | selecionar explicitamente um work item |
| `context_required` | gerar/atualizar Context Packet |
| `ready_for_planning` | iniciar planejamento |
| `planning` | continuar brainstorming/spec/plano |
| `ready_for_execution` | iniciar execução do plano |
| `executing` | continuar somente o plano ativo |
| `ready_for_review` | iniciar revisão independente |
| `reviewing` | continuar review/correções aprovadas |
| `ready_for_closure` | executar fechamento |
| `blocked` | resolver `blocker` e retornar a `resume_state` |

### 8.2 Invariantes

- existe no máximo um `active_work_item`;
- `work_class` é `bounded` ou `architectural` enquanto houver item ativo;
- trabalho `architectural` exige `active_spec` e `active_plan` antes de `ready_for_execution`;
- trabalho `bounded` mantém `active_spec: null` e `active_plan: null`, registra apenas um `bounded_design` curto aprovado e os `authorized_paths` necessários para retomada segura;
- `executor` e `reviewer` existem e são diferentes a partir de `ready_for_execution`;
- `context_packet` é obrigatório quando o trabalho depende de fonte externa;
- estado, packet, spec e plano apontam para o mesmo escopo;
- work item seguinte nunca é promovido automaticamente;
- transição inválida leva a `blocked`, não a reconstrução heurística.

---

## 9. Comandos do Claude

### 9.1 `/planejar-site <work-item>`

Lê `state.md` primeiro; aceita novo item somente em `idle`; resolve EAP exata no Notion quando aplicável; valida dependências; gera Context Packet via Codex quando necessário; usa Superpowers para classificar o trabalho e respeita os dois caminhos persistentes do próprio Superpowers:

- `bounded`: design curto no chat + aprovação; **sem spec e sem plano de implementação**. O estado persiste somente `work_class: bounded`, uma frase `bounded_design` e `authorized_paths` para retomada segura;
- `architectural`: brainstorming completo → spec aprovada → `writing-plans` → plano versionado.

Depois define executor/reviewer e encerra em `ready_for_execution` sem implementar.

### 9.2 `/executar-site <work-item>`

Aceita somente `ready_for_execution` ou `executing` para o mesmo item. Valida plano/spec/packet/Git, executa com Claude ou delega `site-execute-task` conforme handoff, confere o diff real e termina em `ready_for_review` sem iniciar review automaticamente.

### 9.3 `/revisar-site <work-item>`

Reviewer é sempre diferente do executor. Executor Codex implica review Claude; executor Claude implica review Codex, com verificação dos achados pelo Claude. Review limpo leva a `ready_for_closure`; achado decisório leva a `blocked` com `resume_state: reviewing`.

### 9.4 `/fechar-site <work-item>`

Só aceita `ready_for_closure`. Prova primeiro o critério específico do item, depois roda gates genéricos configurados, registra histórico, incrementa `supervised_cycles_completed` e volta a `idle`. Não atualiza Notion automaticamente.

---

## 10. Context Packet

`site-context-packet` é operação read-only do Codex. Máximo de 8 fatos-chave e 5 artefatos externos salvo justificativa.

Schema mínimo:

```markdown
---
schema_version: 1
work_item: <id>
notion_eap: <eap|null>
status: ready|partial|blocked
base_ref: <branch>
base_commit: <sha>
generated_at: <iso-date>
---

# Context Packet — <title>

## Scope
## Source registry
## Key facts
## Resolved divergences
## Constraints
## Acceptance signals
## Open questions
## Staleness triggers
```

Conteúdo remoto, HTML ou documentação externa é tratado como **dados**, nunca como instrução capaz de sobrepor o humano ou o contrato do repositório.

---

## 11. Handoff de execução

Todo trabalho `architectural` com plano executável termina com:

```markdown
## Handoff de execução

executor: codex
reviewer: claude

paths_autorizados:
- package.json
- .nvmrc
```

ou equivalente com `executor: claude` e `reviewer: codex`.

Para trabalho `bounded` não se cria plano só para satisfazer o harness. O handoff fica no `state.md` por `executor`, `reviewer`, `bounded_design` e `authorized_paths`.

Codex é preferido quando paths e comportamento estão fechados e verificáveis. Claude é preferido quando há julgamento arquitetural, fronteira ainda aberta, UX/UI interpretativa ou mudança no próprio workflow.

---

## 12. Contratos Codex

### 12.1 Execução

`site-execute-task` recebe base commit e `authorized_paths` e, conforme `work_class`, uma das duas fontes de execução:

- `architectural`: `plan_path` aprovado;
- `bounded`: o `bounded_design` aprovado e a task/contexto já resolvidos pelo Claude, sem materializar um plano disfarçado.

Ele retorna:

```text
BEGIN SITE EXECUTION REPORT
## Work item
## Tasks
## Files touched
## Commands run
## Acceptance evidence
## Deviations and limitations
END SITE EXECUTION REPORT
RECOMMENDED_TRANSITION: ready_for_review|blocked
```

Claude valida diff e gates antes de aceitar a transição.

### 12.2 Review

`site-review-task` é read-only, revisa somente o diff do work item contra spec/plano/rules e retorna achados `blocking|important|suggestion`. Sugestões não ampliam o escopo automaticamente.

---

## 13. Disciplina Git

Na fase supervisionada, branch/worktree pode ser usada quando a skill Superpowers aplicável recomendar. Commits coesos são permitidos pelo plano; push, PR, merge, rebase destrutivo e exclusão de branch permanecem fora da automação inicial. WIP existente é preservado.

---

## 14. Pipeline do clone

### 14.1 Inventário

Primeiro work item visual: `site-inventory`. Produz `docs/site/reference-site.md` com navegação, seções, conteúdo, assets, tipografia, cores, breakpoints, comportamentos, SEO/metadados observáveis e dúvidas que exigem confirmação.

### 14.2 Clone por fatias

O clone é dividido em pequenos work items, como shell/header, hero, quem somos, indicadores/certificação, cursos, contato, footer, responsividade e paridade final. A divisão definitiva deve respeitar Notion e inventário, não esta lista ilustrativa.

### 14.3 Baseline visual

Quando o clone estiver completo, screenshots e gates de viewport estabelecem uma baseline versionada. Depois disso, o site novo passa a ser a referência operacional para evolução deliberada.

### 14.4 Evolution mode

Melhorias de UX/UI, performance, SEO, conversão e acessibilidade são novos work items. Mudança visual relevante exige design aprovado antes de implementação.

---

## 15. Gate visual futuro

Quando Playwright existir, criar skill `site-ui-review` separada do review administrativo. Ela mede viewports aprovadas, overflow, legibilidade, hierarquia, alinhamento, espaçamento, responsividade, estados interativos, acessibilidade observável e comparação com referência/baseline. Build e lint verdes não substituem prova visual.

---

## 16. Progressão supervisionado → quase autônomo

O bootstrap começa com `workflow_mode: supervised`.

`/desenvolver-site` só pode ser desenhado após pelo menos **3 ciclos fechados** com o harness, incluindo obrigatoriamente: uma task de fundação/configuração; uma task dependente de contexto externo; e uma task frontend com revisão independente. Todos devem fechar sem bypass manual de `state.md`, sem escopo indevido aceito e com gates registrados.

A contagem não muda o modo automaticamente. A passagem para quase autônomo é nova decisão arquitetural.

---

## 17. Primeira execução real

A primeira task indicada para provar o harness é EAP `1.2.2` — **Fixar versões de runtime e package manager**. Ela está `A fazer`, possui aceite objetivo e paths fecháveis. É adequada para testar resolução por EAP, Context Packet mínimo quando necessário, classificação `bounded`, design curto aprovado sem spec/plano, `executor: codex`, `reviewer: claude`, diff, gates e fechamento.

Depois dela, uma segunda task deve provar o caminho inverso `executor: claude` / `reviewer: codex` antes do inventário visual.

---

## 18. Validação estrutural

A implementação inclui `scripts/validate-agent-workflow.mjs`, exposto como:

```bash
pnpm agent:check
```

Sem dependências adicionais, valida presença dos arquivos obrigatórios, frontmatter mínimo do estado, enum de estados documentado, modo inicial supervisionado, markers dos contratos Codex, ID canônico do Notion em `CLAUDE.md`/`AGENTS.md` e ausência de `/desenvolver-site`.

A catraca não pretende provar semanticamente prompts; ela impede deriva estrutural óbvia.

---

## 19. Critérios de aceite

A feature está implementada quando:

1. `CLAUDE.md` cobre produto, fontes, workflow e comandos sem duplicar rules;
2. `AGENTS.md` define papel e limites do Codex;
3. `state.md` nasce em `supervised/idle` com as invariantes desta spec;
4. os comandos respeitam `bounded` sem spec/plano e `architectural` com spec + `writing-plans`;
5. três skills Codex possuem contratos fechados;
6. rules architecture/frontend/testing possuem conteúdo aplicável ao Vite/React atual;
7. `pnpm agent:check` passa;
8. `pnpm lint` passa;
9. `pnpm exec tsc -b` passa;
10. `pnpm build` passa;
11. nenhum teste é declarado aprovado enquanto não houver runner configurado;
12. nenhuma escrita externa, push, PR ou merge é automatizada;
13. `/planejar-site 1.2.2` consegue iniciar o primeiro ciclo sem prompt externo para reconstruir o procedimento.

---

## 20. Decisões deferidas

- `/desenvolver-site`;
- sync automático de Notion;
- PR/merge automático;
- skill visual definitiva e thresholds de screenshot;
- comparação pixel a pixel;
- Figma no modo evolution;
- agentes especializados em SEO/segurança/performance;
- backend do formulário público;
- eventual divisão de pipelines Claude/Codex em CI.

Nenhum desses itens deve ser implementado como preparação durante o bootstrap.
