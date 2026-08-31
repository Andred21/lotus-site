# Homologação de paridade — clone Lotus OTEC

> Bloco `6.1.1-6.3.1` · branch `feat/6-1-1-6-3-1-qa-visual-performance`
> Gate formal antes de preparar o domínio para produção (EAP `6.3.1`).

## Veredito

| item               | situação              | evidência                                                                                                                                                                                                      |
| ------------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Matriz de paridade | aprovado com ressalva | `docs/inventario/README.md` + `docs/qa/paridade/2026-08-29/classificacao.md`; duas linhas seguem abertas — altura vertical das seções (`pendente decisão`, `D-24`) e peso real das fontes self-hosted (`D-23`) |
| Testes             | aprovado              | `pnpm check` (135 testes) e `pnpm e2e` (67 testes, 5 projetos) executados de verdade na review de `2026-08-29`, exit 0 nos dois — a primeira versão desta linha citava execução sem log                        |
| Formulário         | **parcial declarado** | provado contra a API documentada; envio real não provado — `D-17`                                                                                                                                              |
| SEO                | aprovado com ressalva | `e2e/seo.spec.ts` verde; validadores públicos pendentes — `D-22`                                                                                                                                               |
| Acessibilidade     | aprovado com ressalva | `e2e/a11y.spec.ts` verde; nove nós sob exceção nominal — `D-21`                                                                                                                                                |
| Performance        | aprovado              | `docs/qa/performance/2026-08-29/resumo.md` (baseline) e `resumo-pos-otimizacao.md`, cada um com seu relatório cru versionado (Performance 97 -> 99, LCP 2184 -> 2112 ms)                                       |

## O que este bloco fez

1. **`6.1.1`/`6.1.2`** — referência do WordPress e captura do clone, mesmos cinco estados (quatro
   viewports mais menu aberto em 375), versionadas em `docs/qa/paridade/2026-08-29/` com `sha256`
   por arquivo e `contact-sheet.html` lado a lado.
2. **`6.1.3`** — três divergências não intencionais encontradas por medição direta
   (`getBoundingClientRect`/`getComputedStyle` contra `https://lotusotec.cl/`, não só inspeção visual
   do contact-sheet) e corrigidas: tipografia do corpo dos três destaques, legenda dos cards de
   curso e tamanho do texto do rodapé. Uma diferença nova ficou como `divergência intencional`
   ratificada por João em `2026-08-29T08:55:14Z` (ícone do menu mobile ao abrir). Um falso-positivo
   (logo do cabeçalho em 1440) foi descartado por medição pixel-a-pixel antes de virar código.
   A review do bloco reverteu uma quarta mudança que tinha entrado junto: a troca da **cor** do
   rodapé para `#666666`. A cor medida no original é `#24a2e0` (`getComputedStyle` de
   `#footer-info` ao vivo e pixel da captura versionada) — o rodapé fica `text-caption`
   (tamanho corrigido) com `text-brand` (cor de sempre). Uma quinta diferença, o resíduo de altura
   da página, deixou de ser "observação não classificável": a review mediu a causa e ela entrou na
   matriz como `pendente decisão` (`D-24`).
3. **`6.1.4`** — Playwright ganhou `firefox`, `webkit` e `mobile-webkit` além de `chromium`; fecha
   `D-10`. As 64 execuções do fluxo principal nos quatro motores passaram sem achado de paridade
   novo.
4. **`6.2.1`** — Lighthouse entrou como devDependency; mede as categorias, LCP e CLS do build de
   produção. O audit clássico de elemento do LCP não existe mais no Lighthouse 13.4.1 (vem `null`);
   `scripts/qa/lib/perf.mjs` lê `lcp-breakdown-insight`, o formato real da versão instalada, e os
   dois resumos nomeiam o elemento — `h1#hero-heading`, "LOTUS OTEC" (corrigido na review: o resumo
   publicava `não reportado` com a causa disponível no mesmo relatório).
5. **`6.2.2`** — `preload` das duas faces acima da dobra, guardado por
   `e2e/regressao-visual.spec.ts` (`toHaveScreenshot`, zero diferença). Performance 97→99, LCP
   2184 ms → 2112 ms (-3,3%), com relatório cru próprio por medição. O `preload` da foto do hero
   saiu na review: o LCP medido é o `<h1>`, não a foto, e D10 só conserva mudança dirigida pelo
   gargalo medido. Achado colateral: as fontes self-hosted de peso 500/700 (Montserrat) e
   600 (Open Sans) são cópias do arquivo de outro peso — registrado como débito novo (`D-23`), fora
   do escopo de performance deste bloco.
6. **`6.2.3`** — `e2e/producao.spec.ts` roda contra o build de produção (`webServer` dedicado, porta
   própria) e reprova erro de console real ou request `4xx`/`5xx`; provado que reprova de verdade com
   injeção temporária de `console.error`, removida antes do commit. Hydration não se aplica: a
   aplicação monta com `createRoot`, sem SSR.

## Divergências intencionais

Todas registradas na matriz de `docs/inventario/README.md`, incluindo a nova desta rodada (ícone do
menu mobile), ratificada por João em `2026-08-29T08:55:14Z`.

**Uma linha da matriz fica como `pendente decisão`:** "Altura vertical das seções" — o clone é mais
curto que a referência em todas as larguras (375 -565px, 768 -95px, 1440 -332px, 1920 -304px). A
causa foi medida na review e classificada como `spacing`; corrigir é bloco de paridade próprio
(`D-24`). Esta homologação **não** afirma que só divergência aprovada permanece.

## Débitos que seguem abertos

- `D-17` — envio real do formulário não provado: não há conta nem access key do Web3Forms.
  Decisão de João em 2026-08-27 (D5 da spec deste bloco, reafirmada): o bloco fecha com o débito
  aberto. **Gatilho:** antes do go-live.
- `D-21` — nove nós de `color-contrast` sob exceção nominal, cor medida do original. A entrada do
  rodapé segue `#24a2e0`/4,46:1: a troca para `#666666` feita nesta rodada foi revertida na review,
  porque contradiz a cor medida no original. No seletor mudou só o nome da classe de tamanho
  (`text-body` -> `text-caption`), sob a emenda E1 da spec. **Gatilho:** redesign.
- `D-22` — JSON-LD e tags sociais validados só localmente. **Gatilho:** primeiro deploy.
- `D-23` — **novo nesta rodada.** Fontes self-hosted de peso 500/700 (Montserrat) e 600 (Open Sans)
  são cópias byte-a-byte do arquivo de outro peso (`sha256` idêntico); nenhum texto `font-bold`/
  `font-semibold` do site renderiza com glifo realmente mais pesado. Corrigir exige fontes reais de
  cada peso — aquisição de asset, não código. **Gatilho:** próxima rodada de tipografia, ou pedido
  explícito de João.
- `D-25` — `e2e/regressao-visual.spec.ts` roda no projeto `chromium` (dev server), enquanto o
  `preload` que ele guarda só existe no build de produção. Achado da segunda lente sem a
  confirmação do Codex exigida por D7 (a segunda passada do reviewer não rodou por limite de uso da
  conta); registrado por decisão de João em 2026-08-29. **Gatilho:** próxima mudança que só exista
  no build, ou confirmação do reviewer.
- `D-26` — a matriz de paridade não tem linha para o peso real das fontes (`D-23`). Mesmo estatuto:
  achado da segunda lente, sem confirmação, registrado por decisão de João em 2026-08-29.
  **Gatilho:** confirmação do reviewer, correção de `D-23`, ou nova rodada de paridade.
- Débito novo — `a11y.spec.ts` e `seo.spec.ts` rodam só em Chromium (D4 da spec deste bloco).
  **Gatilho:** quando houver relato de falha de acessibilidade fora do Chromium.
- Débito novo — cada rodada de paridade versiona ~3,5 MB de PNG por lado (referência + clone) em
  `docs/qa/paridade/2026-08-29/` (D6 da spec deste bloco). **Gatilho:** terceira rodada, ou quando o
  repositório incomodar.
- `D-24` — **novo nesta rodada, medido na review.** O clone é mais curto que a referência em todas
  as larguras (375 -565px, 768 -95px, 1440 -332px, 1920 -304px). Causa isolada elemento a elemento:
  `padding` dos cards de destaque, margens verticais do hero, quebra de parágrafo do institucional,
  `padding`/gap das linhas de cursos e contato, container do copyright. Categoria `spacing`, sem
  defeito visual observável (sem corte, sem sobreposição, sem rolagem horizontal). Corrigir mexe em
  cinco seções nas quatro larguras e obriga recaptura, nova ratificação e novos snapshots — bloco
  próprio. **Gatilho:** decisão de João de abrir o bloco de correção, ou nova rodada de paridade.

## O que esta homologação não prova

A matriz não cobre peso de fonte: `D-23` prova que nenhum `font-bold`/`font-semibold` do site
renderiza com glifo realmente mais pesado, e isso é divergência visual não intencional contra o
original — declarada como débito, não classificada na matriz de paridade.

A review deste bloco teve uma passada só do reviewer independente: a segunda, sobre os commits de
correção, não rodou por limite de uso da conta Codex. As correções dos achados R-1 a R-7 foram
verificadas por Claude com medição e gates reexecutados (`pnpm check` 135 testes, `pnpm e2e` 67
testes, exit 0 nos dois), não por segunda leitura independente. Os dois achados da lente de Claude
que dependiam dessa confirmação ficaram como `D-25` e `D-26`, por decisão de João em 2026-08-29.

Paridade medida em Chromium, Firefox e WebKit sobre a home. Não há segunda página. A performance é
laboratório local (uma máquina, `vite preview`), não campo. Nenhuma mensagem de formulário chegou a
uma caixa de entrada real. A ratificação de `6.1.3` foi por lista resumida (D2 da spec), não leitura
par a par de cada captura — o `contact-sheet.html` fica versionado para essa leitura ficar possível
depois.

## Adendo de 2026-08-30 — bloco `paridade-espacamento-fontes`

Quatro das ressalvas desta homologação foram fechadas: `D-23` (peso de fonte sem arquivo próprio),
`D-24` (altura vertical das seções), `D-25` (guarda de regressão apontada para o dev server) e
`D-26` (peso de fonte sem linha na matriz). Evidência: `docs/qa/paridade/2026-08-30/`. As ressalvas
`D-17`, `D-21` e `D-22` continuam abertas.

Duas notas adicionais desta rodada:

- **D4 revogada.** A decisão de repartir `site.institucional.body` em array de parágrafos partia da
  premissa de que a referência quebrava o texto em `<p>` separados; medição direta
  (`document.querySelectorAll('#Somos p')`) mostrou um único `<p>`. A Task 7 do plano não rodou;
  `site.institucional.body` permanece `string`.
- **Débito novo, `D-28`.** A correção de `D-24` isolou um resíduo com causa própria: os cards de
  curso escalam a imagem com a largura da coluna (`w-full`) no clone, contra uma imagem de tamanho
  fixo (`400×300px`) na referência. Em colunas mais largas que 400px isso infla a altura do card —
  visível sobretudo em 768px, onde inverteu o sinal do resíduo (clone passou de mais baixo para mais
  alto que a referência). É categoria `asset`/`layout`, fora do escopo de `spacing` deste bloco.
- **Custo de performance registrado.** As faces reais de fonte (`D-23`) somaram bytes ao bundle:
  Performance caiu de 99 para 97 e o LCP piorou de 2112ms para 2569ms (CLS sem mudança). Nenhuma
  otimização foi tentada — decisão de agir fica com João. Evidência:
  `docs/qa/performance/2026-08-30/resumo-fontes-reais.md`.
