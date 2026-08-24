# Backlog — Lotus Site

> Fila operacional local. Não é fase e não autoriza execução: item só fica ativo por seleção
> explícita do João em `docs/superpowers/state.md`. Notion é o roadmap externo; este arquivo é o
> recorte ainda relevante. Item fechado sai daqui e o rastro fica em
> `docs/superpowers/historico/progress.md`.
>
> Este arquivo nunca promove item, nunca define fase e nunca replica todas as tasks do Notion.

## Fluxo

```text
Notion → backlog.md → state.md → context packet → brainstorm/spec/plan → execução → review →
closure → progress.md
```

`seleção explícita → context_required (quando indicado) → /planejar-site → /executar-site →
/revisar-site → /fechar-site`

---

# AGORA

## 1.1.6 · Endurecer workflow agentic e criar backlog operacional
**Frente:** Harness · **Contexto:** não · **Fonte:** Notion `1.1.6`; `docs/1.1.6-agentic-workflow-hardening.md`
**Objetivo:** fortalecer o harness agentic antes de avançar a fundação funcional, para conduzir o
trabalho de ponta a ponta na IDE com o mínimo de transferência manual para chats externos.
**Escopo:** backlog operacional; rules de arquitetura/frontend objetivas; catracas de fronteira no
ESLint; contratos Codex com preconditions, limites, evidência e checklist; `agent:check` ampliado.
**DoD:** backlog existe e o `CLAUDE.md` o consulta sem tratá-lo como estado; catracas cobrem o que é
viável; `agent:check`, lint, typecheck e build verdes; nenhum fluxo autônomo, sync de Notion ou UI
review dependente de Playwright criado prematuramente.

## 1.2.2 · Fixar versões de runtime e package manager
**Frente:** Setup · **Contexto:** não · **Fonte:** Notion `1.2.2` (depende de `1.2.1`, Concluída)
**Objetivo:** adicionar `.nvmrc`, `engines` e `packageManager` para evitar deriva entre máquinas e CI.
**Escopo:** `.nvmrc` com o Node do projeto; `engines` no `package.json`; `packageManager` já fixado
por `1.1.4` permanece.
**DoD:** versões esperadas documentadas e o gerenciador alerta runtime incompatível.

## 1.2.3 · Endurecer configuração TypeScript
**Frente:** Setup · **Contexto:** não · **Fonte:** Notion `1.2.3` (depende de `1.2.1`, Concluída)
**Objetivo:** manter `strict` e habilitar `noUncheckedIndexedAccess`, sem `any` para contornar erro.
**Escopo:** `tsconfig.app.json` e `tsconfig.node.json`; corrigir o que a flag acusar.
**DoD:** typecheck passa com `strict` e `noUncheckedIndexedAccess` habilitados.

---

# DEPOIS

Tema, sem replicar EAP. Contagem medida contra o Notion em 2026-08-24.

- **Tooling e qualidade** — Sprint 0 restante (`1.2.4`–`1.3.9`, 12 tasks): gitignore/editorconfig/env,
  dependências mínimas de runtime, Prettier + ordenação Tailwind, Vitest, Playwright, axe,
  arquitetura de pastas (`1.3.5`), scripts de qualidade, CI inicial, ADR-SITE-001, baseline técnico.
- **Inventário do site** — Sprint 1 (10): páginas, conteúdo e assets de `lotusotec.cl`.
- **Clone estático** — Sprint 2 (15): paridade visual e de conteúdo.
- **Formulário e integrações** — Sprint 3 (10).
- **SEO e acessibilidade** — Sprint 4 (10).
- **QA visual e performance** — Sprint 5 (8).
- **Deploy e go-live** — Sprint 6 (12).
- **Evolução pós-clone** — Sprint 7 (7).
- **Workflow IA** — Sprint 8 (3): `9.1.1`–`9.1.3`, ver `D-03`.

---

# DÉBITOS

- **D-01 · Notion descreve Next.js onde o repositório é Vite** — `4.1.2`, `4.1.3`, `5.1.1`, `5.1.2`,
  `5.2.2` e `7.1.1` citam Server Action, App Router, `next/image` ou sitemap via Next.js. A task
  `1.2.1` entregou Vite + React + TypeScript e está Concluída. Essas tasks são stale até
  reconciliação; não atualizar Notion sem autorização explícita do João.
  **Gatilho:** antes de planejar Sprint 3.
- **D-02 · 1.1.6 e 1.3.5 tocam a mesma fronteira** — `1.1.6` escreve as regras de camada e a catraca
  de import; `1.3.5` cria as pastas com consumidor real. Nenhum diretório nasce em `1.1.6`.
  **Gatilho:** ao planejar `1.3.5`.
- **D-03 · Sprint 8 pressupõe harness criado após a estabilização** — `9.1.2` prevê definir
  `AGENTS.md`/`CLAUDE.md` a partir da arquitetura consolidada, mas os dois existem desde o bootstrap
  e `1.1.6` os endurece. Reconciliar o escopo de `9.1.1`–`9.1.3`.
  **Gatilho:** ao planejar Sprint 8.
- **D-04 · Limite numérico de tamanho/complexidade adiado** — sem amostra do clone não há como
  calibrar `max-lines`, `max-lines-per-function` ou `complexity`; hoje a regra é textual.
  **Gatilho:** após Sprint 2.
- **D-05 · Cobertura de gate incompleta** — `agent:check` não roda em CI até `1.3.7`; review visual
  não tem Playwright até `1.3.3`. A limitação é registrada no relatório de review, nunca simulada.
  **Gatilho:** ao fechar `1.3.3` e `1.3.7`.
