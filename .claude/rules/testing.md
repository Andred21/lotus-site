# Testing and verification — Lotus Site

- Diferencie sempre análise estática, execução local e CI.
- Nunca declare teste como aprovado quando não há runner configurado.
- O critério de aceite específico do work item é provado antes dos gates genéricos.
- Gates atuais: `pnpm lint`, `pnpm exec tsc -b`, `pnpm build`.
- Quando Vitest existir, adicione testes unitários ao gate; quando Playwright existir, work item visual exige prova no navegador.
- Build verde não prova paridade visual.
- Review deve inspecionar o diff real; relatório de subagent/Codex é evidência auxiliar.
- Ferramenta ausente não deve ser baixada ad hoc durante review; registre a limitação ou implemente a ferramenta em task própria.
