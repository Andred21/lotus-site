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
- **D-10 · Playwright cobre só Chromium** — WebKit e Firefox ficaram de fora do baseline por
  não haver clone a comparar. Paridade visual em outro motor não é verificada hoje.
  **Gatilho:** ao planejar o Sprint 5.
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
  **Gatilho:** quando João criar a conta, antes de `7.1.4` e do go-live.
- **D-20 · imagem social é o logo 500×500** — `og:image`/`twitter:image` usam
  `public/LOTUS-G2_TRANSP_Fondo-Blanco.png` com `twitter:card summary` (D4 do bloco `5.1.1-5.3.2`).
  Card grande (1200×630) exige arte nova, fora do clone.
  **Gatilho:** redesign ou pedido explícito de João.
- **D-21 · nove nós de `color-contrast` sob exceção nominal** — quatro links do menu desktop
  (`#24a2e0` sobre `#f8f8f8`, 2.7:1), três corpos dos destaques (`#747d88` sobre `#f0f0f0`,
  3.66:1), o `mailto` (`#2ea3f2` sobre `#f0f0f0`, 2.41:1) e o rodapé (`#666666` sobre `#323232`,
  2.23:1 — corrigido na rodada `2026-08-29`: o valor antigo, `#24a2e0`/4.46:1, nunca foi a cor
  medida do original, era bug de implementação do Sprint 1 que a exceção cristalizou; ver
  `docs/qa/paridade/2026-08-29/classificacao.md`) são cor medida do original, `fiel` na matriz, e
  vivem em `e2e/a11y-exceptions.ts` com motivo, fonte e gatilho (D9 do bloco `5.1.1-5.3.2`).
  Corrigir viola a Lei 1. A mesma cor de nó pode aparecer duas vezes na lista sob seletores de
  classe diferentes: o axe reordena a lista de classes do elemento conforme o estado da página,
  então duas entradas com `target` distinto às vezes descrevem o mesmo nó, não uma segunda
  violação — quem for investigar uma falha de "exceção órfã" deve conferir o nó antes de presumir
  duplicidade.
  **Gatilho:** redesign, quando a paleta deixar de ser paridade.
- **D-22 · JSON-LD e tags sociais validados só localmente** — schema Zod `strict` e parse em
  `src/app/head.test.ts`, mais `og:image` resolvendo em `e2e/seo.spec.ts` (D5/D10 do bloco
  `5.1.1-5.3.2`). Rich Results Test e depuradores sociais (Facebook, LinkedIn, X) exigem URL
  pública.
  **Gatilho:** primeiro deploy, antes do go-live.
- **D-23 · fontes self-hosted de peso 500/700 (Montserrat) e 600 (Open Sans) são cópias do
  arquivo de outro peso** — `src/assets/fonts/montserrat-400.woff2`, `montserrat-500.woff2` e
  `montserrat-700.woff2` têm o mesmo `sha256`; `open-sans-500.woff2` e `open-sans-600.woff2`
  também. Achado na rodada de QA `2026-08-29` (`docs/qa/paridade/2026-08-29/classificacao.md`,
  `docs/qa/performance/2026-08-29/resumo-pos-otimizacao.md`) ao medir performance: o Vite dedupe
  por conteúdo, então as três declarações `@font-face` de Montserrat no build resolvem hoje para
  um único arquivo físico. Nenhum texto `font-bold`/`font-semibold` do site (h1 do hero, headings
  de seção, botões CTA, nav semibold) renderiza com glifo realmente mais pesado. Corrigir exige
  baixar/gerar o arquivo real de cada peso — aquisição de asset, não código; fora do escopo de
  performance do bloco `6.1.1-6.3.1` (D10 da spec: só o gargalo medido é atacado, sem otimizador ou
  asset novo sem medição que justifique).
  **Gatilho:** próxima rodada que mexer em tipografia, ou pedido explícito de João.
