---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/**/*.css"
---

# Frontend — Lotus Site

- Componentes React funcionais, pequenos e com responsabilidade clara.
- Não usar `any` para contornar tipagem; respeitar `verbatimModuleSyntax` e imports `type`.
- Não usar `useEffect` para estado puramente derivável.
- Não criar Context/Zustand/Redux sem necessidade comprovada.
- Helper/constante reutilizável não deve morar no mesmo módulo que exporta componente quando isso viola `react-refresh/only-export-components`.
- Durante `clone`, fidelidade aprovada vence preferência estética do agente.
- Durante `evolution`, mudança visual relevante exige design aprovado antes da implementação.
- Responsividade e acessibilidade fazem parte do critério de aceite da UI, não são polish opcional.
- Não espalhar strings institucionais repetidas por componentes quando uma fonte de conteúdo já existir.
- Cor ou fonte nova vira token no bloco `:root` de `src/index.css` (`--text`, `--bg`, `--accent`, `--sans`, …); não fixar valor direto em componente.
