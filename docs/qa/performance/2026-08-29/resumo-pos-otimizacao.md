# Lighthouse — build de produção

> URL medida: http://localhost:5184/ · execução: 2026-08-29T09:21:00.716Z
> Relatório cru: `lighthouse.json` nesta pasta.

## Categorias

| categoria        | score |
| ---------------- | ----- |
| Performance      | 99    |
| Accessibility    | 96    |
| Best Practices   | 100   |
| SEO              | 100   |
| Agentic Browsing | 67    |

## Core Web Vitals

- LCP: 2.0 s (2019 ms)
- CLS: 0
- elemento do LCP: não reportado

## Ressalva

Medição de **laboratório**, numa máquina só, contra `vite preview` local. Não é dado de campo e
não descreve o que um visitante real experimenta. Nenhum score aqui é meta: o que orienta a EAP
`6.2.2` é a causa apontada, não o número.

## Delta contra a primeira medição

| métrica             | antes   | depois  | mudança         |
| ------------------- | ------- | ------- | --------------- |
| Performance (score) | 97      | 99      | +2              |
| LCP                 | 2184 ms | 2019 ms | -165 ms (-7,6%) |
| CLS                 | 0       | 0       | sem mudança     |

Mudança aplicada: `<link rel="preload">` para a fonte crítica acima da dobra e para a foto do hero
acima de 1000px, injetado no build por `scripts/vite/preload-critical.mjs`. Nenhum pixel mudou —
`e2e/regressao-visual.spec.ts` verde contra os snapshots pré-otimização, em 375 e 1440.

**A causa medida não foi a foto do hero.** `lighthouse.json` desta rodada não popula mais o audit
clássico `largest-contentful-paint-element` (retorna `null` nesta versão do Lighthouse, que migrou
parte da atribuição de causa para os audits `*-insight`). O elemento do LCP foi confirmado por
`lcp-breakdown-insight` (nó `h1#hero-heading`, "LOTUS OTEC") — o `<h1>` do hero, não a foto.

**Achado fora do escopo desta EAP, registrado como débito:** o alvo de fonte do preload é
`montserrat-400-*.woff2`, não `montserrat-700-*` como o `font-bold` do `<h1>` declara. Motivo:
`src/assets/fonts/montserrat-400.woff2`, `montserrat-500.woff2` e `montserrat-700.woff2` são bytes
idênticos (mesmo `sha256`), assim como `open-sans-500.woff2` e `open-sans-600.woff2` — um sprint
anterior fez self-host copiando o mesmo arquivo sob três/dois nomes em vez de baixar cada peso real.
O Vite dedupe por conteúdo, então as três declarações `@font-face` de Montserrat no build hoje
resolvem para o mesmo arquivo físico. Nenhum texto "bold"/"semibold" do site (h1 do hero, headings
de seção, botões CTA, nav semibold) renderiza com glifo realmente mais pesado — todos caem no
arquivo cujo conteúdo é o mesmo. Corrigir exige fontes reais de cada peso (aquisição de asset), fora
do escopo de performance desta EAP; ver débito novo em `docs/superpowers/backlog.md`.
