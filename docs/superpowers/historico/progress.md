# Progresso — Lotus Site

> Histórico curto de entregas fechadas. Este arquivo não controla a fase do workflow.
> Estado atual: `docs/superpowers/state.md`.

| Data | Work item | Executor | Reviewer | Resultado | Referências |
|---|---|---|---|---|---|
| 2026-08-24 | 1.1.4 · Habilitar Corepack e fixar pnpm do projeto | claude | codex | PASS · `packageManager: pnpm@11.23.0+sha512` fixado; reinstalação limpa e gates verdes sob Node 24.19.0 | bounded — sem spec/plano; context_packet null; diff em `package.json` |
| 2026-08-24 | 1.1.6 · Endurecer workflow agentic e criar backlog operacional | claude | codex | PASS · backlog operacional criado; rules e contratos Codex reescritos; fronteiras de import/global impostas no ESLint; `agent:check` valida estado, backlog, rules e skills em qualquer fase; review com R-1..R-3 blocking corrigidos e R-4 corrigido sob autorização explícita | spec `docs/superpowers/specs/2026-08-24-1.1.6-agentic-workflow-hardening-design.md`; plano `docs/superpowers/plans/2026-08-24-1.1.6-agentic-workflow-hardening.md`; context_packet null |
| 2026-08-24 | 1.2.2+1.2.3 · Bloco Setup — fixar runtime/package manager e endurecer TypeScript | claude | codex | PASS · `.nvmrc` 24.19.0 + `engines` (node `>=24.19.0 <25`, pnpm `>=11 <12`); `engineStrict: true` no `pnpm-workspace.yaml` transforma runtime incompatível em `ERR_PNPM_UNSUPPORTED_ENGINE` (exit 1 sob Node 22.23.1, exit 0 sob 24.19.0); `strict` e `noUncheckedIndexedAccess` ligados nos dois tsconfig com fallout zero, flags provadas por sonda temporária (TS2532); review Codex R-1 blocking (`pnpm typecheck` inexistente) corrigido com script `typecheck` sob decisão explícita do João | bounded — sem spec/plano; context_packet null; bloco de duas EAP autorizado por João; branch `chore/harness-branch-commit-pr`; PR https://github.com/Andred21/lotus-site/pull/3 |
