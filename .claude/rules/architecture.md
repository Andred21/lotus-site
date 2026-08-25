---
paths:
  - 'src/**'
  - 'vite.config.ts'
---

# Architecture — Lotus Site

- O site começa como aplicação institucional de baixa complexidade; abstrações precisam pagar o custo de manutenção.
- Não adicionar router enquanto a navegação continuar sendo uma única página por âncoras.
- Não adicionar estado global quando estado local/derivado for suficiente.
- Assets importados por componente ficam em `src/assets/`; arquivos que precisam de URL estável ficam em `public/`.
- `public/icons.svg` é um sprite; ícone novo entra como `<symbol id>` dentro dele, não como arquivo separado.

## Estrutura alvo

```text
src/
├── app/            composição da aplicação
├── components/
│   ├── layout/     shell, Header, Footer, containers estruturais
│   ├── sections/   seções completas da landing page
│   └── ui/         primitivas realmente reutilizadas
├── content/        conteúdo institucional e dados estáticos
├── integrations/   APIs, formulário, analytics, serviços externos
├── lib/            helpers puros, sem React
└── assets/         assets importados por componente (Vite fingerprinta)
```

Diretório não nasce vazio: só existe quando houver consumidor real. A criação da estrutura é a task
`1.3.5`, não esta rule.

## Direção de dependências

```text
content      → não importa React, componente ou integração
lib          → não importa React nem componente
ui           → não importa sections
components/* → não importa integrations; integração entra por prop/callback
app          → é o único lugar que liga integração a componente
```

Violação dessas quatro linhas é erro de `pnpm lint` (`eslint.config.js`), não só de revisão.

## Limites

- Abstração precisa de consumidor real; não criar wrapper, provider ou índice de barrel antecipado.
- Decisão que muda interface ou fronteira exige brainstorming/spec antes do código.
