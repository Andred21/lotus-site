# Lighthouse — build de produção

> URL medida: http://localhost:5184/ · execução: 2026-08-30T23:38:34.323Z
> Relatório cru: `lighthouse-fontes-reais.json` nesta pasta.

## Categorias

| categoria        | score |
| ---------------- | ----- |
| Performance      | 97    |
| Accessibility    | 96    |
| Best Practices   | 100   |
| SEO              | 100   |
| Agentic Browsing | 67    |

## Core Web Vitals

- LCP: 2.6 s (2569 ms)
- CLS: 0
- elemento do LCP: <h1 id="hero-heading" class="font-display text-hero font-bold text-brand"> — "LOTUS OTEC"

## Ressalva

Medição de **laboratório**, numa máquina só, contra `vite preview` local. Não é dado de campo e
não descreve o que um visitante real experimenta. Nenhum score aqui é meta: o que orienta a EAP
`6.2.2` é a causa apontada, não o número.

## Delta contra a medição de `6.2.2`

| métrica             | 6.2.2 (dedupado) | fontes-reais (esta medição) | mudança          |
| ------------------- | ---------------- | --------------------------- | ---------------- |
| Performance (score) | 99               | 97                          | -2               |
| LCP                 | 2112 ms          | 2569 ms                     | +457 ms (+21,6%) |
| CLS                 | 0                | 0                           | sem mudança      |

6.2.2 (`docs/qa/performance/2026-08-29/resumo-pos-otimizacao.md`) mediu o build em que
`montserrat-400`, `montserrat-500` e `montserrat-700` eram bytes idênticos (mesmo `sha256`) e o
Vite dedupava as três declarações `@font-face` para um único arquivo físico — e o preload apontava
para esse arquivo dedupado (`montserrat-400-*.woff2`, na prática servindo o mesmo peso que
`montserrat-700`). Esta medição roda contra o build das Tasks 1 e 2 do bloco
`paridade-espacamento-fontes`: os três pesos de Montserrat agora são arquivos `.woff2` com glifos
reais e tamanhos distintos (`montserrat-400` 37,95 kB, `montserrat-500` 18,74 kB, `montserrat-700`
18,82 kB — antes um único arquivo servia os três), e o `<link rel="preload">` foi corrigido para
apontar para `montserrat-700`, a face que o `font-bold` do `<h1 id="hero-heading">` (elemento do
LCP) de fato usa. A queda de Performance (-2) e o aumento de LCP (+457 ms) refletem bytes reais a
mais entrando na cadeia crítica de carregamento — não uma regressão de configuração. Por D10 do
bloco `6.1.1-6.3.1`, só o gargalo medido é atacado e a decisão de agir sobre este número cabe a
João; nenhuma otimização foi tentada nesta task.
