---
paths:
  - '**'
---

# Testing and verification — Lotus Site

- Diferencie sempre análise estática, execução local e CI.
- Nunca declare teste como aprovado quando não há runner configurado.
- O critério de aceite específico do work item é provado antes dos gates genéricos.
- Gates atuais: `pnpm check` (`agent:check` + `lint` + `typecheck` + `test` + `build`). `pnpm e2e` fica fora de `check` porque precisa subir servidor; roda separado e é exigido no CI.
- `pnpm agent:check` valida o contrato do harness (estado, backlog, rules, skills), não o produto.
- Vitest e Playwright existem desde o bloco `1.2.4-1.3.9`. Work item visual exige prova E2E no navegador via `pnpm e2e`, não só `pnpm check` verde.
- Build verde não prova paridade visual.
- Review deve inspecionar o diff real; relatório de subagent/Codex é evidência auxiliar.
- Ferramenta ausente não deve ser baixada ad hoc durante review; registre a limitação ou implemente a ferramenta em task própria.
