# Homologação de paridade — clone Lotus OTEC

> Bloco `6.1.1-6.3.1` · branch `feat/6-1-1-6-3-1-qa-visual-performance`
> Gate formal antes de preparar o domínio para produção (EAP `6.3.1`).

## Veredito

| item               | situação              | evidência                                                                                                |
| ------------------ | --------------------- | -------------------------------------------------------------------------------------------------------- |
| Matriz de paridade | aprovado              | `docs/inventario/README.md` + `docs/qa/paridade/2026-08-29/classificacao.md`                             |
| Testes             | aprovado              | `pnpm check` e `pnpm e2e` (67 testes, 5 projetos) verdes em `2026-08-29T09:34:24Z`                       |
| Formulário         | **parcial declarado** | provado contra a API documentada; envio real não provado — `D-17`                                        |
| SEO                | aprovado com ressalva | `e2e/seo.spec.ts` verde; validadores públicos pendentes — `D-22`                                         |
| Acessibilidade     | aprovado com ressalva | `e2e/a11y.spec.ts` verde; nove nós sob exceção nominal — `D-21`                                          |
| Performance        | aprovado              | `docs/qa/performance/2026-08-29/resumo.md` e `resumo-pos-otimizacao.md` (Performance 97→99, LCP -165 ms) |

## O que este bloco fez

1. **`6.1.1`/`6.1.2`** — referência do WordPress e captura do clone, mesmos cinco estados (quatro
   viewports mais menu aberto em 375), versionadas em `docs/qa/paridade/2026-08-29/` com `sha256`
   por arquivo e `contact-sheet.html` lado a lado.
2. **`6.1.3`** — três divergências não intencionais encontradas por medição direta
   (`getBoundingClientRect`/`getComputedStyle` contra `https://lotusotec.cl/`, não só inspeção visual
   do contact-sheet) e corrigidas: tipografia do corpo dos três destaques, legenda dos cards de
   curso e tipografia/cor do rodapé. Uma diferença nova ficou como `divergência intencional`
   ratificada (ícone do menu mobile ao abrir). Um falso-positivo (logo do cabeçalho em 1440) foi
   descartado por medição pixel-a-pixel antes de virar código.
3. **`6.1.4`** — Playwright ganhou `firefox`, `webkit` e `mobile-webkit` além de `chromium`; fecha
   `D-10`. As 64 execuções do fluxo principal nos quatro motores passaram sem achado de paridade
   novo.
4. **`6.2.1`** — Lighthouse entrou como devDependency; mede as categorias, LCP e CLS do build de
   produção. O audit clássico de elemento do LCP veio `null` nesta versão do Lighthouse; o elemento
   real (`<h1 id="hero-heading">`) foi confirmado por `lcp-breakdown-insight`.
5. **`6.2.2`** — `preload` da fonte crítica acima da dobra e da foto do hero (só ≥1000px), guardado
   por `e2e/regressao-visual.spec.ts` (`toHaveScreenshot`, zero diferença). Performance 97→99, LCP
   2184 ms → 2019 ms (-7,6%). Achado colateral: as fontes self-hosted de peso 500/700 (Montserrat) e
   600 (Open Sans) são cópias do arquivo de outro peso — registrado como débito novo (`D-23`), fora
   do escopo de performance deste bloco.
6. **`6.2.3`** — `e2e/producao.spec.ts` roda contra o build de produção (`webServer` dedicado, porta
   própria) e reprova erro de console real ou request `4xx`/`5xx`; provado que reprova de verdade com
   injeção temporária de `console.error`, removida antes do commit. Hydration não se aplica: a
   aplicação monta com `createRoot`, sem SSR.

## Divergências intencionais

Todas registradas na matriz de `docs/inventario/README.md`, incluindo a nova desta rodada (ícone do
menu mobile). Nenhuma divergência deste bloco ficou como `pendente decisão`.

## Débitos que seguem abertos

- `D-17` — envio real do formulário não provado: não há conta nem access key do Web3Forms.
  Decisão de João em 2026-08-27 (D5 da spec deste bloco, reafirmada): o bloco fecha com o débito
  aberto. **Gatilho:** antes do go-live.
- `D-21` — nove nós de `color-contrast` sob exceção nominal, cor medida do original. A entrada do
  rodapé foi corrigida nesta rodada (`#666666`/2,23:1, não mais `#24a2e0`/4,46:1 — o valor antigo
  era bug de implementação do Sprint 1, não a cor real medida). **Gatilho:** redesign.
- `D-22` — JSON-LD e tags sociais validados só localmente. **Gatilho:** primeiro deploy.
- `D-23` — **novo nesta rodada.** Fontes self-hosted de peso 500/700 (Montserrat) e 600 (Open Sans)
  são cópias byte-a-byte do arquivo de outro peso (`sha256` idêntico); nenhum texto `font-bold`/
  `font-semibold` do site renderiza com glifo realmente mais pesado. Corrigir exige fontes reais de
  cada peso — aquisição de asset, não código. **Gatilho:** próxima rodada de tipografia, ou pedido
  explícito de João.
- Débito novo — `a11y.spec.ts` e `seo.spec.ts` rodam só em Chromium (D4 da spec deste bloco).
  **Gatilho:** quando houver relato de falha de acessibilidade fora do Chromium.
- Débito novo — cada rodada de paridade versiona ~3,5 MB de PNG por lado (referência + clone) em
  `docs/qa/paridade/2026-08-29/` (D6 da spec deste bloco). **Gatilho:** terceira rodada, ou quando o
  repositório incomodar.
- Débito novo — altura total da home em 375px diverge da referência (~565px) mesmo após as
  correções de `6.1.3`; causa não isolada nesta rodada, sem defeito visual observável. Ver
  "Observação aberta" em `docs/qa/paridade/2026-08-29/classificacao.md`. **Gatilho:** relato de
  discrepância percebida, ou nova rodada de paridade.

## O que esta homologação não prova

Paridade medida em Chromium, Firefox e WebKit sobre a home. Não há segunda página. A performance é
laboratório local (uma máquina, `vite preview`), não campo. Nenhuma mensagem de formulário chegou a
uma caixa de entrada real. A ratificação de `6.1.3` foi por lista resumida (D2 da spec), não leitura
par a par de cada captura — o `contact-sheet.html` fica versionado para essa leitura ficar possível
depois.
