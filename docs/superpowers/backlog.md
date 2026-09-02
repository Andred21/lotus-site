# Backlog — Lotus Site

> Fila operacional local. Não é fase e não autoriza execução: item só fica ativo por seleção
> explícita do João em `docs/superpowers/state.md`. Notion é o roadmap externo; este arquivo é o
> recorte ainda relevante. Item fechado sai daqui e o rastro fica em
> `docs/superpowers/historico/progress.md`.
>
> Este arquivo nunca promove item, nunca define fase e nunca replica todas as tasks do Notion.

## Fluxo

```text
Notion → backlog.md → state.md → context packet → brainstorm/spec/plan → execução → review →
closure → progress.md
```

`seleção explícita → context_required (quando indicado) → /planejar-site → /executar-site →
/revisar-site → /fechar-site`

---

# AGORA

Nada ativo. `docs/superpowers/state.md` está em `idle`: o próximo item entra por seleção explícita
do João, nunca por promoção automática deste arquivo.

O bloco `4.1.1`–`4.1.10` (Formulário e integrações — Sprint 3) fechou em 2026-08-28 no PR
https://github.com/Andred21/lotus-site/pull/7; o rastro está em
`docs/superpowers/historico/progress.md`. **Pendências abertas com João:** a conferência humana de
paridade visual contra os cinco PNG de `docs/inventario/baseline/`, herdada da Sprint 2 e nunca
feita — nenhum gate a substitui —, e a conta do Web3Forms, sem a qual o envio real continua não
provado (`D-17`).

---

# DEPOIS

Tema, sem replicar EAP. Contagem medida contra o Notion em 2026-08-24.

- **SEO e acessibilidade** — Sprint 4 (10).
- **QA visual e performance** — Sprint 5 (8).
- **Deploy e go-live** — Sprint 6 (12).
- **Evolução pós-clone** — Sprint 7 (7).
- **Workflow IA** — Sprint 8 (3): `9.1.1`–`9.1.3`, ver `D-03`.

---

# DÉBITOS

- **D-01 · Notion descreve Next.js onde o repositório é Vite** — `4.1.2`, `4.1.3`, `5.1.1`, `5.1.2`,
  `5.2.2` e `7.1.1` citam Server Action, App Router, `next/image` ou sitemap via Next.js. A task
  `1.2.1` entregou Vite + React + TypeScript e está Concluída. Essas tasks são stale até
  reconciliação; não atualizar Notion sem autorização explícita do João.
  Quinta instância em 2026-08-28 (D1 da spec do bloco `5.1.1-5.3.2`): `5.1.1`, `5.1.2` e `5.2.2`
  descrevem Metadata API, `app/robots`, `app/sitemap` e `next/image`; entregues como `<head>`
  estático em `index.html`, `public/robots.txt` + `public/sitemap.xml` e `<img>` com
  `width`/`height`, `loading="lazy"` e `decoding="async"`, sem otimizador.
  **Gatilho:** antes de planejar Sprint 3.
- **D-02 · 1.1.6 e 1.3.5 tocam a mesma fronteira** — `1.1.6` escreve as regras de camada e a catraca
  de import; `1.3.5` cria as pastas com consumidor real. Nenhum diretório nasce em `1.1.6`.
  **Gatilho:** ao planejar `1.3.5`.
- **D-03 · Sprint 8 pressupõe harness criado após a estabilização** — `9.1.2` prevê definir
  `AGENTS.md`/`CLAUDE.md` a partir da arquitetura consolidada, mas os dois existem desde o bootstrap
  e `1.1.6` os endurece. Reconciliar o escopo de `9.1.1`–`9.1.3`.
  **Gatilho:** ao planejar Sprint 8.
- **D-04 · Limite numérico de tamanho/complexidade adiado** — sem amostra do clone não há como
  calibrar `max-lines`, `max-lines-per-function` ou `complexity`; hoje a regra é textual.
  **Gatilho:** após Sprint 2.
- **D-06 · `scripts/*.mjs` fora de qualquer projeto TypeScript** — `tsconfig.node.json` tem
  `"include": ["vite.config.ts"]`, então `scripts/validate-agent-workflow.mjs` não é typechecked por
  `tsc -b` nem coberto pelo `strict` ligado em `1.2.3`. Levantado na review de `1.2.2+1.2.3` como
  suggestion e deixado fora do escopo.
  **Gatilho:** ao planejar `1.3.6` (scripts de qualidade) ou `1.3.7` (CI).
  **Fechado por este bloco** (`1.2.4`–`1.3.9`) em 2026-08-24.
- **D-07 · `engineStrict` exige Node 24 no CI** — com `engineStrict: true`, qualquer script pnpm
  morre com `ERR_PNPM_UNSUPPORTED_ENGINE` fora da faixa de `engines`. O runner precisa ler `.nvmrc`.
  **Gatilho:** ao planejar `1.3.7`.
  **Fechado por este bloco** (`1.2.4`–`1.3.9`) em 2026-08-24.
- **D-05 · Cobertura de gate incompleta** — `agent:check` não roda em CI até `1.3.7`; review visual
  não tem Playwright até `1.3.3`. A limitação é registrada no relatório de review, nunca simulada.
  **Gatilho:** ao fechar `1.3.3` e `1.3.7`.
  **Parcialmente fechado por este bloco** (`1.2.4`–`1.3.9`) em 2026-08-24 — `agent:check` passou a
  rodar em CI e o Playwright passou a existir.
- **D-08 · Tailwind entrou sem EAP própria** — nenhuma task do roadmap instala `tailwindcss`,
  mas `1.2.5` pede `tailwind-merge` e `1.3.1` pede `prettier-plugin-tailwindcss`. Tailwind foi
  absorvido por `1.2.5` por decisão de João em 2026-08-24. Reconciliar com o Notion quando
  houver autorização de escrita.
  **Gatilho:** junto de `D-01`, antes de planejar o Sprint 3.
- **D-09 · Estrutura de `1.3.5` divergiu do Notion** — a EAP pedia `features/contact`, `config`,
  `tests` e `docs`; `.claude/rules/architecture.md` venceu e esses diretórios não nasceram, por
  decisão de João em 2026-08-24. `components/`, `app/` e `integrations/` nascem com consumidor
  real.
  **Gatilho:** ao planejar o Sprint 3.
- **D-10 · Playwright cobre só Chromium** — **fechado em 2026-08-29** pelo bloco `6.1.1-6.3.1`
  (`6.1.4`): `playwright.config.ts` declara `chromium`, `firefox`, `webkit` e `mobile-webkit`; o
  fluxo principal (`home`, `menu`, `contacto`) roda nos quatro, e o CI instala os três motores.
  `a11y.spec.ts` e `seo.spec.ts` seguem só em Chromium — ver débito novo na homologação
  `docs/qa/homologacao-2026-08-29.md`.
- **D-11 · axe reporta mas não reprova** — **fechado em 2026-08-28** pelo bloco `5.1.1-5.3.2`
  (`5.2.4`): `e2e/a11y.spec.ts` audita cinco estados e reprova violação `critical`/`serious` sem
  exceção nominal em `e2e/a11y-exceptions.ts`; exceção órfã também reprova. As nove exceções
  iniciais viraram `D-21`.
- **D-12 · `3.1.4` manda os assets para `public/`, a rule manda para `src/assets/`** — o título da EAP
  é "Migrar assets para public", mas `.claude/rules/architecture.md:12` e `CLAUDE.md:92` reservam
  `public/` para arquivo que precisa de URL estável. João decidiu em 2026-08-25 que a regra do
  repositório vence: as imagens de conteúdo ficam em `src/assets/` (fingerprint do Vite) e só os 4
  ícones de `<head>` vão para `public/`. Foram 6 imagens, não 7: `background-texture.jpg` não
  pinta pixel visível no baseline e ficou de fora como divergência intencional. O Notion fica
  stale até reconciliação autorizada.
  **Gatilho:** junto de `D-01`, `D-08` e `D-09`, antes de planejar o Sprint 3.
- **D-13 · `3.1.1` usa vocabulário de Next.js** — o critério de aceite diz "sem Client Component
  desnecessário"; o repositório é Vite + React, onde esse conceito não existe. Lido como "não
  introduzir estado/interatividade sem necessidade". Terceira instância do mesmo problema de `D-01`,
  agora dentro do Sprint 2.
  **Gatilho:** junto de `D-01`, antes de planejar o Sprint 3.
- **D-14 · breakpoints exatos não medidos** — `05-layout.md` só prova que a virada do menu
  desktop/mobile e a do container `1080px` ficam entre `768` e `1440`; `1350px` é derivação da regra
  dos 80%, não largura medida. A EAP `3.2.10` precisa dos quatro viewports-alvo, não do valor exato,
  então o bloco não fica bloqueado — mas o clone escolhe um breakpoint sem medição que o confirme.
  **Fechado por este bloco** (`3.1.1`–`3.2.11`) em 2026-08-26 — o commit `chore(3.1.2)` mediu
  `900`–`1400` e `05-layout.md:64-76` registra as duas viradas; o clone usa `1000px`, medido.
- **D-15 · rule de ícones ficou órfã** — `.claude/rules/architecture.md:13` manda ícone novo entrar
  como `<symbol id>` em `public/icons.svg`; o sprite era do scaffold Vite, morreu no commit
  `feat(3.1.1)` junto do `App.tsx` que o consumia, e os ícones deste bloco vêm de `lucide-react`.
  `public/` hoje só tem os quatro `cropped-Logo-*.png`. `.claude/rules/**` não está em
  `paths_autorizados` do bloco, então a rule não foi corrigida aqui.
  **Gatilho:** task própria de manutenção das rules, antes de planejar o Sprint 3.
- **D-16 · `extract-styles.mjs` ainda mede o nó-eco escondido do Divi** — `extract-styles.mjs:68` usa
  `section.querySelector(selector)`, que pega o primeiro nó do seletor na seção e alcança o eco
  duplicado pelo Divi (`hero.title_subtitle_echo`). O commit `chore(3.1.2)` corrigiu a **cor**
  (`cssColor` preserva o alpha) e documentou os quatro casos conhecidos em `04-tipografia.md`, mas
  não corrigiu a seleção do nó: regerar `styles.json` sem tratar isso reintroduz o erro em qualquer
  seção nova.
  **Gatilho:** antes de qualquer regeração de `styles.json` ou de inventário de página nova.
  **Reafirmado em 2026-08-30** pelo bloco `paridade-espacamento-fontes`: `scripts/qa/lib/espacamento.mjs`
  evitou o defeito por construção (par de seletor explícito referência/clone, `medirNo` reprova
  seletor que casa com zero ou mais de um nó) sem corrigir `extract-styles.mjs`. `D-16` continua
  aberto.
- **D-18 · Prettier reescreve plano e spec aprovados** — `format:check` faz parte de `pnpm check` e
  `prettier-plugin-tailwindcss` reordena classe Tailwind dentro de bloco de código de qualquer
  markdown, inclusive `docs/superpowers/plans/**` e `docs/superpowers/specs/**`. É o achado `R-2` da
  review de 2026-08-28: o commit `2663763` levou junto o plano do bloco
  (`docs/superpowers/plans/2026-08-27-4.1.1-4.1.10-formulario-integracoes.md:1463`), fora dos
  `paths_autorizados`, sem replanejamento nenhum — só reordenação de classe num snippet. Reverter o
  trecho sozinho deixa `pnpm format:check` vermelho; a correção é excluir plano e spec do Prettier
  em `.prettierignore`, que é ferramenta do repositório e não estava autorizada neste bloco.
  **Decisão de João em 2026-08-28:** a mutação do plano fica aceita e o bloco `4.1.1-4.1.10` fecha
  com este débito aberto; a correção não entra na branch do bloco.
  **Gatilho:** task própria de harness, junto de `D-15`.
- **D-19 · transição de estado viaja junto de commit de código** — achado `L-7` da review de
  2026-08-28: `fbb3e7e` (`feat(4.1.1)`) carrega `docs/superpowers/state.md` no mesmo commit do
  schema, enquanto o fim do bloco usa `chore` próprio para a mesma coisa. Sem regra escrita, cada
  bloco decide de novo. Não é corrigível aqui: reescrever histórico da branch em review custa mais
  do que o defeito.
  **Gatilho:** task própria de harness, junto de `D-15` e `D-18`.
- **D-17 · envio real do formulário não provado** — não existe conta nem access key do Web3Forms
  nesta rodada (decisão de João em 2026-08-27, D6 da spec do bloco `4.1.1-4.1.10`). O adapter
  `src/integrations/contact/web3forms.ts` está provado contra a API documentada — `fetch` duplicado
  no teste unitário e `page.route` interceptando `api.web3forms.com` no E2E —, mas nenhuma mensagem
  chegou a uma caixa de entrada real, e o aceite da `4.1.7` fecha como **parcial declarado**.
  **Reafirmado em 2026-08-29** (D5 da spec do bloco `6.1.1-6.3.1`): a homologação `6.3.1` também
  fecha com o formulário como parcial declarado.
  **Gatilho:** quando João criar a conta, antes de `7.1.4` e do go-live.
- **D-20 · imagem social é o logo 500×500** — `og:image`/`twitter:image` usam
  `public/LOTUS-G2_TRANSP_Fondo-Blanco.png` com `twitter:card summary` (D4 do bloco `5.1.1-5.3.2`).
  Card grande (1200×630) exige arte nova, fora do clone.
  **Gatilho:** redesign ou pedido explícito de João.
- **D-21 · cinco nós de `color-contrast` sob exceção nominal** (eram nove) — três corpos dos
  destaques (`#747d88` sobre `#f0f0f0`,
  3.66:1), o `mailto` (`#2ea3f2` sobre `#f0f0f0`, 2.41:1) e o rodapé (`#24a2e0` sobre `#323232`,
  4.46:1) são cor medida do original, `fiel` na matriz, e
  vivem em `e2e/a11y-exceptions.ts` com motivo, fonte e gatilho (D9 do bloco `5.1.1-5.3.2`).
  Corrigir viola a Lei 1. A mesma cor de nó pode aparecer duas vezes na lista sob seletores de
  classe diferentes: o axe reordena a lista de classes do elemento conforme o estado da página,
  então duas entradas com `target` distinto às vezes descrevem o mesmo nó, não uma segunda
  violação — quem for investigar uma falha de "exceção órfã" deve conferir o nó antes de presumir
  duplicidade.
  Na rodada `2026-08-29` a entrada do rodapé chegou a ser reescrita para `#666666`/2.23:1; a review
  do bloco `6.1.1-6.3.1` reverteu — `getComputedStyle` de `#footer-info` no site ao vivo devolve
  `rgb(36, 162, 224)` e a captura versionada da própria rodada mostra o mesmo azul
  (`docs/qa/paridade/2026-08-29/classificacao.md`). Só o nome da classe de tamanho mudou no
  seletor (`text-body` -> `text-caption`), e as duas entradas do rodapé viraram uma: com a classe
  nova o axe reporta o mesmo nó por um seletor só, igual nos cinco estados.
  **Quatro dos nove nós fecharam em 2026-09-02, no bloco `paridade-header-cursos`:** os do menu
  desktop eram `#24a2e0` sobre `#f8f8f8`, e o `#f8f8f8` era artefato de rasterização, não cor da
  referência. Com o fundo na cor medida (`#000000`) a razão é 7,31:1 (AAA), o axe deixa de
  reportar os nós e as quatro exceções saíram de `e2e/a11y-exceptions.ts` — exceção órfã reprova
  o gate. Nenhuma cor foi trocada por escolha estética: a paridade fechou o defeito de contraste.
  **Gatilho:** redesign, quando a paleta deixar de ser paridade.
- **D-22 · JSON-LD e tags sociais validados só localmente** — schema Zod `strict` e parse em
  `src/app/head.test.ts`, mais `og:image` resolvendo em `e2e/seo.spec.ts` (D5/D10 do bloco
  `5.1.1-5.3.2`). Rich Results Test e depuradores sociais (Facebook, LinkedIn, X) exigem URL
  pública.
  **Gatilho:** primeiro deploy, antes do go-live.
- **D-23 · fontes self-hosted de peso 500/700 (Montserrat) e 600 (Open Sans) são cópias do
  arquivo de outro peso** — `src/assets/fonts/montserrat-400.woff2`, `montserrat-500.woff2` e
  `montserrat-700.woff2` têm o mesmo `sha256`; `open-sans-500.woff2` e `open-sans-600.woff2`
  também. Achado na rodada de QA `2026-08-29` ao medir performance
  (`docs/qa/performance/2026-08-29/resumo-pos-otimizacao.md`; a classificação de paridade da rodada
  não trata de fonte self-hosted): o Vite dedupe
  por conteúdo, então as três declarações `@font-face` de Montserrat no build resolvem hoje para
  um único arquivo físico. Nenhum texto `font-bold`/`font-semibold` do site (h1 do hero, headings
  de seção, botões CTA, nav semibold) renderiza com glifo realmente mais pesado. Corrigir exige
  baixar/gerar o arquivo real de cada peso — aquisição de asset, não código; fora do escopo de
  performance do bloco `6.1.1-6.3.1` (D10 da spec: só o gargalo medido é atacado, sem otimizador ou
  asset novo sem medição que justifique).
  **Gatilho:** próxima rodada que mexer em tipografia, ou pedido explícito de João.
  **Fechado em 2026-08-30 pelo bloco `paridade-espacamento-fontes`** — Task 1: as três faces
  baixadas via UA de navegador antigo (endpoint `css2` sob UA moderno devolvia fonte variável
  única, não instâncias estáticas; decisão de João), cinco `sha256` distintos, catraca em
  `scripts/inventario/fontes.test.mjs`. Evidência: `docs/inventario/04-tipografia.md`,
  `docs/qa/paridade/2026-08-30/classificacao.md`.
- **D-24 · o clone é mais curto que a referência em todas as larguras** — 375 `5467px` -> `4902px`
  (-565), 768 `4913px` -> `4818px` (-95), 1440 `3441px` -> `3109px` (-332), 1920 `3409px` ->
  `3105px` (-304). A rodada `2026-08-29` registrou isso como observação não classificável; a
  review do bloco `6.1.1-6.3.1` mediu a causa elemento a elemento contra `https://lotusotec.cl/` e
  classificou como `spacing`: `padding: 30px` nos cards de destaque e `padding-bottom: 10px` no
  título deles, margens verticais do hero (`45/40/50px` na referência contra `mt-8`/`32px` no
  clone), parágrafo institucional que a referência quebra em `<p>` com 19px entre eles, `padding`
  e gap das linhas de cursos e de contato, e o container do copyright. Nenhum conteúdo falta e não
  há defeito visual observável (sem corte, sem sobreposição, sem rolagem horizontal). Corrigir é
  bloco de paridade próprio: mexe em cinco seções, nas quatro larguras, e obriga recaptura, nova
  ratificação (D2) e novos snapshots de `toHaveScreenshot`. Enquanto isso, a linha "Altura
  vertical das seções" fica `pendente decisão` na matriz — ver
  `docs/qa/paridade/2026-08-29/classificacao.md`.
  **Gatilho:** decisão de João de abrir o bloco de correção, ou próxima rodada de paridade.
  **Fechado em 2026-08-30 pelo bloco `paridade-espacamento-fontes`** — hero (margens
  medidas 45/0/40/50px), destaques (padding `30px`/`10px`), calha e padding responsivo de cursos e
  contacto, e rodapé (bate exato, delta `0`, nas quatro larguras). Institucional: premissa de D4
  não se confirmou, revogada. Resíduo remanescente nomeado: bloco de ícone dos destaques (`-26px`,
  já aprovado) e imagem dos cards de curso (ver `D-28`, débito novo). "Altura vertical das seções"
  passa de `pendente decisão` para `divergência intencional` na matriz. Evidência:
  `docs/qa/paridade/2026-08-30/espacamento.md`, `docs/qa/paridade/2026-08-30/classificacao.md`.
- **D-25 · o guarda de regressão visual aponta para o dev server, não para o build** —
  `e2e/regressao-visual.spec.ts` roda no projeto `chromium` de `playwright.config.ts`, que serve o
  `pnpm dev` na porta 5183; a mudança que ele existe para guardar (`<link rel="preload">` injetado
  por `scripts/vite/preload-critical.mjs`) só é produzida pelo build, servido pelo projeto
  `producao` na 5184. O guarda prova que o dev server não mudou de pixel, o que é verdadeiro e
  insuficiente. Mover o spec para o projeto `producao` implica regerar os snapshots sob o nome do
  projeto novo. Achado da segunda lente (Claude) na review do bloco `6.1.1-6.3.1`, **sem a
  confirmação do Codex que D7 da spec exige**: a segunda passada do reviewer não rodou por limite
  de uso da conta Codex. Registrado como débito por decisão de João em 2026-08-29, não corrigido.
  **Gatilho:** próxima mudança que só exista no build de produção, ou quando a cota do reviewer
  permitir a confirmação.
  **Fechado em 2026-08-30 pelo bloco `paridade-espacamento-fontes`** — Task 10: `chromium` ganhou
  `regressao-visual.spec.ts` no `testIgnore`, `producao` ganhou o spec no `testMatch`, snapshots
  regenerados sob o pixel final do bloco. `pnpm e2e` completo fecha verde (67 passed). Evidência:
  `e2e/regressao-visual.spec.ts`, `playwright.config.ts`.
- **D-26 · peso real das fontes não tem linha na matriz de paridade** — `D-23` prova que nenhum
  texto `font-bold`/`font-semibold` do site renderiza com glifo mais pesado, o que é divergência
  visual contra o original; a matriz de `docs/inventario/README.md` não tem linha para isso, e a
  homologação `6.3.1` aprova a matriz "com ressalva" citando o débito. Achado da segunda lente
  (Claude) na review do bloco `6.1.1-6.3.1`, **sem a confirmação do Codex que D7 exige** (mesma
  limitação de cota). Registrado por decisão de João em 2026-08-29: a linha na matriz entra quando
  o achado for confirmado, junto com a correção de `D-23` ou na próxima rodada de paridade.
  **Gatilho:** confirmação do reviewer, correção de `D-23`, ou nova rodada de paridade.
  **Fechado em 2026-08-30 pelo bloco `paridade-espacamento-fontes`** — linha "Peso real das fontes
  self-hosted" criada em `docs/inventario/README.md`, decisão `fiel`, citando `D-23` e a catraca de
  `scripts/inventario/fontes.test.mjs`.
- **D-27 · a review do bloco `refactor-contato-intake` não teve segunda lente** — o invariante do
  harness exige `executor` e `reviewer` diferentes, e `scripts/validate-agent-workflow.mjs:160`
  transforma isso em erro de `pnpm agent:check`. A cota da conta Codex estava esgotada, e João
  autorizou explicitamente em 2026-08-29 que Claude fosse executor e reviewer do bloco, com o
  desvio declarado. A review existiu — diff de `main..HEAD` lido linha a linha, referências
  pendentes e afirmações do `CONTEXT.md` e do `ADR-SITE-003` conferidas contra o repositório — mas
  quem revisou escreveu o código, então ela não vale como lente independente. Consequência
  mecânica: com `reviewer: claude` no estado, `pnpm agent:check` reprova e `pnpm check` junto.
  **Gatilho:** cota do Codex de volta para uma segunda passada sobre estes dois commits, ou decisão
  de João sobre representar o desvio no validador em task própria do harness.
- **D-28 · imagem dos cards de curso escala com a coluna; a referência usa tamanho fixo** —
  `src/components/sections/Cursos.tsx` usa `className="aspect-[4/3] w-full object-cover"` na
  imagem de cada card, escalando com a largura da coluna. A referência (`https://lotusotec.cl/`)
  usa uma imagem de `400×300px` fixos, centralizada, que não cresce além disso. Em colunas mais
  largas que 400px (768/1440/1920 neste layout) o clone fica desproporcionalmente mais alto —
  achado da rodada de paridade `2026-08-30`, isolado ao investigar por que o resíduo de altura
  vertical inverteu de sinal em 768px (clone passou de mais baixo para mais alto que a referência).
  Categoria `asset`/`layout`, não `spacing`: fora do escopo do bloco `paridade-espacamento-fontes`,
  que só corrigiu padding/margem/gap. Evidência: `docs/qa/paridade/2026-08-30/classificacao.md`
  (item 8).
  **Gatilho:** próximo bloco de paridade visual, ou pedido explícito de João.
  **Fechado em 2026-09-02 pelo bloco `paridade-header-cursos`, com o enunciado corrigido.** A
  referência não usa `400×300px` fixos: usa `max-width: 100%` + `height: auto` sobre o tamanho
  intrínseco de cada asset, centralizado. Medido nas quatro larguras — card 1 (`400×300`) rende
  `300×225` em 375, `400×300` em 768 e `320×240` em 1440/1920; cards 2 e 3 são **quadrados** de
  `250×250` que nunca escalam, não `4:3`. Os assets de `src/assets/` já tinham os intrínsecos
  certos; o defeito era só o clone forçar `aspect-[4/3] w-full object-cover` nos três, esticando e
  cortando os dois quadrados. Corrigido com `mx-auto h-auto max-w-full` e `width`/`height` por
  asset. O vão até o nome do curso entrou junto por autorização de João (`30px` medidos contra os
  `24px` de `mt-6`), porque a mudança de tamanho já obrigava snapshot novo no mesmo eixo.
  Evidência: `docs/qa/paridade/2026-09-02/header-cursos.md`, sem divergência nas quatro larguras.
- **D-29 · margens da referência não reproduzidas em `#Cursos` e na linha de contato** —
  `docs/qa/paridade/2026-08-30/espacamento.json` mede, nas quatro larguras, `cursos.secao` com
  `marginBottom: -105px` na referência contra `0` no clone, e `contacto.linha` com
  `marginBottom: 9px` contra `0`. A rodada de 2026-08-30 corrigiu padding e gap, mas não estas duas
  margens, e a classificação não as nomeava — achado `C-2` da review do bloco
  `paridade-espacamento-fontes`, declarado em 2026-08-31 no adendo de
  `docs/qa/paridade/2026-08-30/classificacao.md` e de `espacamento.md`. Reproduzir o `-105px` faz
  `#Cursos` sobrepor `#Contacto` como na referência e desloca contato e rodapé em 105px: é mudança
  de posição de duas seções inteiras, não ajuste local, e a decisão é de João.
  **Gatilho:** decisão de João sobre reproduzir a sobreposição, ou próximo bloco de paridade visual
  (junto com `D-28`).
  **Fechado em 2026-08-31 pelo bloco `paridade-espacamento-fontes`** — João mandou resolver todos os
  achados da review. Medição adicional na referência mostrou que o `-105px` cancela 105 dos 110px de
  `paddingBottom` de `#Cursos`, sem sobrepor conteúdo (mesmo fundo nas duas seções, `#Contacto`
  começa 5px depois da linha do CTA). Aplicados `-mb-26.25` em `#Cursos` e `mb-2.25` na linha de
  título do contato, no lugar do `<div className="h-2.25" />` separador. As duas propriedades batem
  com a referência nas quatro larguras. Evidência:
  `docs/qa/paridade/2026-08-30/espacamento.md` (seção "Desfecho"),
  `docs/qa/paridade/2026-08-30/classificacao.md`.

- **D-30 · os cinco PNG de `docs/inventario/baseline/` reportam o cabeçalho na cor errada** —
  `scripts/inventario/capture-baseline.mjs:9` captura com `fullPage: true`, e nesse modo o
  cabeçalho desktop rasteriza `#f8f8f8` onde o screenshot de viewport, na mesma página e na mesma
  sessão, rasteriza `#000000`. `sample-baseline.mjs` amostrou esses PNG e publicou o artefato como
  cor medida; `docs/inventario/04-tipografia.md` e `src/index.css` seguiram, e só a medição ao vivo
  de 2026-09-02 desfez a cadeia (`docs/qa/paridade/2026-09-02/header-cursos.md`). Isso **trava a
  conferência humana dos cinco PNG**, que já era débito e agora tem artefato conhecido no material
  conferido. Demonstrado para `#main-header`; **não provado** para o resto da paleta — quem
  recapturar precisa reamostrar tudo, não só o cabeçalho. Fora do bloco por decisão de João em
  2026-09-02: corrigir `capture-baseline.mjs` invalida os cinco PNG de uma vez e arrasta
  `sample-baseline.mjs`.
  **Gatilho:** bloco próprio de recaptura do baseline, antes da conferência humana.
- **D-31 · a afirmação `rgba(0, 0, 0, 0.03)` do cabeçalho não reproduz** —
  `docs/inventario/04-tipografia.md` (corrigido em 2026-09-02) e
  `scripts/inventario/lib/site.mjs:96-98` (ainda não) afirmam que `getComputedStyle` devolve
  `rgba(0, 0, 0, 0.03)` para o fundo de `#main-header` sobre branco. A medição ao vivo devolve
  `rgb(0, 0, 0)` opaco, e o `body` do site também é preto. O defeito de `rgbToHex` (descartar
  alpha) é real e continua justificando o candidato 5 de `revisao-arquitetura-2026-09`, mas o
  cabeçalho não é a prova dele — o caso genuíno é o rodapé (`#545454` na tabela, `#323232` na
  tela). O docstring de `site.mjs` ficou fora do bloco `paridade-header-cursos` porque
  `scripts/inventario/` não estava em `authorized_paths`.
  **Gatilho:** bloco `revisao-arquitetura-2026-09` (candidato 5), ou pedido explícito de João.
