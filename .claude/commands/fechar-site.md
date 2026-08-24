---
description: Fecha o work item ativo somente após aceite e gates provados
argument-hint: [work-item]
disable-model-invocation: true
---

@docs/superpowers/state.md

# Fechar Site — $ARGUMENTS

Leia `state.md` primeiro. Exija `workflow_state: ready_for_closure` e correspondência exata do work item.

Em `blocked` com `resume_state: ready_for_closure` e `blocker` resolvido por João, restaure `workflow_state` para `resume_state`, limpe `blocker` e `resume_state`, e prossiga.

## Gate 0 — aceite específico

Execute a prova específica descrita no plano/Notion/spec. Ferramenta verde genérica não substitui esse critério.

## Gates técnicos atuais

Execute somente comandos realmente configurados:

```bash
pnpm agent:check
pnpm lint
pnpm exec tsc -b
pnpm build
```

`pnpm agent:check` valida o contrato do harness (estado, backlog, rules, skills), não o produto.

Quando Vitest/Playwright forem adicionados por tasks futuras, o próprio `CLAUDE.md`/plano passa a incluí-los. Não invoque runner inexistente.

## Integridade

- inspecione `git status --short` e o diff do work item;
- confirme ausência de arquivo/placeholder criado sem consumidor;
- confirme que nenhuma lei de `CLAUDE.md` foi contrariada;
- não escreva em Notion nem execute push/PR/merge.

## Histórico

Acrescente uma linha a `docs/superpowers/historico/progress.md` com data, work item, executor, reviewer, resultado e paths da spec/plano/packet.

## Estado final

Incremente `supervised_cycles_completed` em 1. Redefina para `null`: `work_class`, `active_work_item`, `active_notion_eap`, `active_title`, `bounded_design`, `authorized_paths`, `resume_state`, `context_packet`, `active_spec`, `active_plan`, `executor`, `reviewer`, `blocker`. Defina `workflow_state: idle`, `next_owner: joao`, `next_action: select_work_item`, `last_completed_work_item: <item fechado>`.

Não promova o próximo item automaticamente. `workflow_mode` permanece `supervised` independentemente do contador.
