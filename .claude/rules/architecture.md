---
paths:
  - "src/**"
  - "vite.config.ts"
---

# Architecture — Lotus Site

- O site começa como aplicação institucional de baixa complexidade; abstrações precisam pagar o custo de manutenção.
- Não adicionar router enquanto a navegação continuar sendo uma única página por âncoras.
- Não adicionar estado global quando estado local/derivado for suficiente.
- Integrações externas não vivem dentro de componentes visuais.
- Conteúdo institucional estável deve migrar para `src/content/` quando o clone começar, em vez de ficar espalhado por JSX.
- `src/components/ui/` só nasce para primitivas realmente reutilizadas; não criar design system antecipado.
- Assets importados por componente ficam em `src/assets/`; arquivos que precisam de URL estável ficam em `public/`.
- `public/icons.svg` é um sprite; ícone novo entra como `<symbol id>` dentro dele, não como arquivo separado.
- Decisão arquitetural nova exige brainstorming/spec quando mudar interfaces ou fronteiras.
