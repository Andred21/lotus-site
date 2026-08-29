# Lighthouse — build de produção

> URL medida: http://localhost:5184/ · execução: 2026-08-29T11:01:09.866Z
> Relatório cru: `lighthouse-pos-otimizacao.json` nesta pasta.

## Categorias

| categoria        | score |
| ---------------- | ----- |
| Performance      | 99    |
| Accessibility    | 96    |
| Best Practices   | 100   |
| SEO              | 100   |
| Agentic Browsing | 67    |

## Core Web Vitals

- LCP: 2.1 s (2112 ms)
- CLS: 0
- elemento do LCP: <h1 id="hero-heading" class="font-display text-hero font-bold text-brand"> — "LOTUS OTEC"

## Ressalva

Medição de **laboratório**, numa máquina só, contra `vite preview` local. Não é dado de campo e
não descreve o que um visitante real experimenta. Nenhum score aqui é meta: o que orienta a EAP
`6.2.2` é a causa apontada, não o número.

## Delta contra a primeira medição

| métrica             | antes   | depois  | mudança        |
| ------------------- | ------- | ------- | -------------- |
| Performance (score) | 97      | 99      | +2             |
| LCP                 | 2184 ms | 2112 ms | -72 ms (-3,3%) |
| CLS                 | 0       | 0       | sem mudança    |

Antes: `lighthouse.json` / `resumo.md` (execução `2026-08-29T09:09:31.190Z`, sem preload).
Depois: `lighthouse-pos-otimizacao.json` / este arquivo (execução `2026-08-29T11:01:09.866Z`).
Cada medição versiona o próprio relatório cru — na primeira versão desta EAP as duas execuções
gravavam sobre o mesmo `lighthouse.json` e este resumo apontava para a medição anterior (achado R-6
da review).

**Mudança retida, uma só:** `<link rel="preload">` para as duas faces acima da dobra, injetado no
build por `scripts/vite/preload-critical.mjs`. Nenhum pixel mudou — `e2e/regressao-visual.spec.ts`
verde contra os snapshots do clone.

**Mudança revertida na review (achado R-5):** o preload da foto do hero
(`shutterstock_1444636373-1-scaled`, `media: (min-width: 1000px)`). O LCP medido é o
`<h1 id="hero-heading">`, não a foto; a primeira versão desta EAP mediu os três preloads juntos e
ficou sem delta próprio para a imagem. D10 da spec só conserva mudança dirigida pelo gargalo
medido — a foto sai, e o delta acima é o da mudança que ficou.

**Elemento do LCP.** O audit clássico `largest-contentful-paint-element` não existe no Lighthouse
13.4.1 (vem `null`): a atribuição de causa migrou para os audits `*-insight`. `scripts/qa/lib/perf.mjs`
passou a ler `lcp-breakdown-insight` (achado R-4 da review) e os dois resumos desta pasta agora
nomeiam o elemento — `h1#hero-heading`, "LOTUS OTEC".

**Achado fora do escopo desta EAP, registrado como débito:** o alvo de fonte do preload é
`montserrat-400-*.woff2`, não `montserrat-700-*` como o `font-bold` do `<h1>` declara. Motivo:
`src/assets/fonts/montserrat-400.woff2`, `montserrat-500.woff2` e `montserrat-700.woff2` são bytes
idênticos (mesmo `sha256`), assim como `open-sans-500.woff2` e `open-sans-600.woff2` — um sprint
anterior fez self-host copiando o mesmo arquivo sob três/dois nomes em vez de baixar cada peso real.
O Vite dedupe por conteúdo, então as três declarações `@font-face` de Montserrat no build hoje
resolvem para o mesmo arquivo físico. Nenhum texto "bold"/"semibold" do site (h1 do hero, headings
de seção, botões CTA, nav semibold) renderiza com glifo realmente mais pesado. Corrigir exige fontes
reais de cada peso (aquisição de asset), fora do escopo de performance desta EAP; ver `D-23` em
`docs/superpowers/backlog.md`.
