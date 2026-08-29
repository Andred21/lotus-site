# Classificação de diferenças — rodada 2026-08-29

> Evidência: `contact-sheet.html` desta pasta, confirmada por medição direta (`getBoundingClientRect`
> e `getComputedStyle`) contra `https://lotusotec.cl/` e o build de produção local — a comparação
> visual do contact-sheet sozinha não é confiável para diferenças de tipografia sutis (duas capturas
> da mesma tela renderizada em zoom ligeiramente diferente pelo visualizador já bastam para simular
> uma divergência que não existe; foi o caso do logo do cabeçalho em `1440`, medido pixel-a-pixel
> idêntico nas duas pontas antes de ser descartado como falso-positivo).
>
> Categorias: `layout`, `tipografia`, `spacing`, `asset`, `responsive`. Decisão: `fiel` (já
> reproduzido), `divergência intencional` (registrada na matriz) ou `corrigir` (não intencional, vira
> código nesta EAP).

| #   | estado            | categoria  | diferença observada                                                                                                                                                                                                                                                                                                                                                                                                                                                    | decisão                                | referência na matriz                                                                                                                                                                               |
| --- | ----------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 375/768/1440/1920 | tipografia | Corpo dos três destaques (`ENERGIZADAS`/`ALUMNOS`/`CERTIFICACIÓN`) media Open Sans 19px/34.2px (`text-lead`) no clone contra Montserrat 16px/28.8px medido na referência.                                                                                                                                                                                                                                                                                              | `corrigir`                             | `docs/inventario/README.md` — linha "Institucional" (o corpo do destaque não é o parágrafo institucional acima; tipografias distintas, confundidas em `Destaques.tsx`)                             |
| 2   | 375/768/1440/1920 | tipografia | Legenda dos três cards de curso media Montserrat 16px/28.8px (`text-body`) no clone contra Open Sans 14px/23.8px medido na referência.                                                                                                                                                                                                                                                                                                                                 | `corrigir`                             | idem — mesma tipografia do rodapé (item 3), não catalogada como token antes desta rodada                                                                                                           |
| 3   | 375/768/1440/1920 | tipografia | Rodapé media Open Sans 16px/28.8px no clone contra Open Sans 14px/23.8px medido na referência (`#footer-info`). **Só o tamanho diverge**: a cor medida na referência é `rgb(36, 162, 224)` = `#24a2e0` (`text-brand`), a mesma que o clone já usava — ver "Correção de rota" abaixo.                                                                                                                                                                                   | `corrigir` (tamanho; a cor é `fiel`)   | `docs/inventario/README.md` — linha "Rodapé" (`fiel`, mas só cobria o texto do copyright em si, não a tipografia medida; ano `2022` preservado, tipografia agora também)                           |
| 4   | 375-menu          | asset      | Ícone do menu mobile alterna de hamburger para `×` e ganha `aria-label` (`Abrir menú`/`Cerrar menú`) ao abrir; o original mantém o mesmo ícone e não expõe `aria-label` no toggle (confirmado: classe do botão não muda ao clicar, `aria-label` é `null`).                                                                                                                                                                                                             | `divergência intencional`              | nova — acessibilidade do menu mobile decidida no bloco `5.1.1-5.3.2`; feedback de estado aberto/fechado sem equivalente medido no original, coberto por `e2e/menu.spec.ts` e `e2e/teclado.spec.ts` |
| 5   | 375/768/1440/1920 | spacing    | Altura total da página menor no clone em todas as larguras: 375 `5467px` -> `4902px` (-565), 768 `4913px` -> `4818px` (-95), 1440 `3441px` -> `3109px` (-332), 1920 `3409px` -> `3105px` (-304). Causa isolada por medição na review — ver "Resíduo de altura" abaixo.                                                                                                                                                                                                 | `corrigir` — fora deste bloco (`D-24`) | `docs/inventario/README.md` — nova linha "Altura vertical das seções"                                                                                                                              |
| —   | 1440/1920         | asset      | Logo do cabeçalho aparenta "esmaecido"/maior no clone ao comparar as duas capturas do `contact-sheet`. Medido pixel-a-pixel (`naturalWidth/Height`, `renderedWidth/Height`, `top`, `left`, `headerHeight`): **idêntico** nas duas pontas (mesmo arquivo, mesmo `205×258` natural, `~63×80` renderizado, `top≈7px`, `headerHeight=94px`). Artefato do redimensionamento da própria captura de tela ao ser exibida em duas escalas diferentes, não uma divergência real. | `fiel` (falso-positivo descartado)     | `docs/inventario/README.md` — linha "Favicon e ícones" / logo do cabeçalho já medido em sprints anteriores                                                                                         |

## Resíduo de altura — causa isolada por medição (achado R-2 da review, 2026-08-29)

A primeira versão desta rodada registrou o resíduo de altura como "não classificável" e o mandou
para débito sem isolar a causa. A review reprovou: o aceite de `6.1.3` e `6.3.1` afirma que só
divergência aprovada permanece, e uma diferença de `-565px` sem categoria contradiz isso. A causa
foi então medida elemento a elemento contra `https://lotusotec.cl/` em 375
(`getBoundingClientRect`/`getComputedStyle`, referência ao vivo × build de produção local).

| seção                     | referência | clone  | delta | causa medida                                                                                                                                                                                  |
| ------------------------- | ---------- | ------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hero                      | `774`      | `625`  | -149  | margens verticais entre kicker, `h1`, corpo e CTA: `45/40/50px` na referência contra `32px` (`mt-8`) no clone; o parágrafo do corpo ocupa 173px (6 linhas) na referência e 115px (4) no clone |
| institucional + destaques | `1974`     | `1628` | -346  | parágrafo institucional `436px` × `342px` (a referência quebra o texto em `<p>` com 19px de espaçamento entre eles; o clone é um bloco só) e cada card de destaque `306px` × `210px`          |
| cursos                    | `1630`     | `1559` | -71   | `padding` da linha `30px` × `27px` e espaço entre cards `30px` × `59px`, com card `303/328/328px` × `297px`                                                                                   |
| contacto                  | `1010`     | `943`  | -67   | mesma classe de diferença: `padding` da linha e espaçamento entre título, texto e formulário                                                                                                  |
| rodapé                    | `78`       | `68`   | -10   | container do copyright `58px` × `48px`                                                                                                                                                        |

Cada card de destaque, medido: a referência tem `padding: 30px` nos quatro lados (60px verticais),
`padding-bottom: 10px` no título e bloco de ícone de `60px` com `margin-bottom: 30px`; o clone não
tem padding no card, usa ícone de `48px` com `margin-top: 16px` no título. Dos `-96px` por card,
`-26px` vêm do bloco de ícone — consequência da divergência intencional já aprovada (ícones
`lucide-react` no lugar dos glifos ETmodules do Divi) — e `-70px` vêm de padding e espaçamento.

**Categoria:** `spacing` (não `layout`: nenhuma seção mudou de ordem, coluna ou breakpoint; nenhum
conteúdo falta). **Decisão:** `corrigir`, **fora deste bloco**, como `D-24`.

Por que não corrigir aqui: a correção não é um ajuste pontual — são paddings, margens e quebras de
parágrafo em cinco seções, em quatro larguras, e ela reabre a paridade já capturada, ratificada e
homologada nesta rodada (recaptura, nova ratificação, novos snapshots de `toHaveScreenshot`). Isso
é um bloco de paridade próprio, não uma correção de review. O que muda aqui é o registro: a
diferença deixa de ser "observação não classificável" e passa a ser **divergência não intencional
aberta, medida e atribuída**, com linha própria na matriz e ressalva na homologação — nenhum
documento deste bloco pode mais afirmar que só divergência aprovada permanece.

## Itens já cobertos pela matriz existente (revisados, sem mudança)

Confirmados nesta rodada como reproduzidos corretamente e sem necessidade de nova linha: cabeçalho
(altura `80px`/`94px`, logo, cor de fundo `#ffffff`/`#f8f8f8`), navegação principal (Open Sans
18px/600, `#24a2e0`), hero (título, subtítulo, corpo, CTA, paddings `10vw`/`8vw`), parágrafo
institucional (`Somos`, Open Sans 19px/34.2px), ícones dos três destaques (`lucide-react`, já
divergência intencional), grade de cursos (imagens, título, CTA), formulário de contato (campos,
rótulos, texto introdutório em Montserrat 16px/28.8px), menu mobile (itens, ordem, foco por teclado).

## Correções aplicadas

1. `src/components/sections/Destaques.tsx` — parágrafo do corpo troca `font-sans text-lead` por
   `font-display text-body`, igual ao padrão já usado em `Hero.tsx`, `Contacto.tsx` e `Cursos.tsx`
   para o mesmo papel tipográfico. Prova: `Destaques.test.tsx`.
2. `src/index.css` — novo token `--text-caption: 14px` / `--text-caption--line-height: 23.8px`,
   preenchendo uma lacuna real na escala tipográfica (Open Sans 14px/23.8px é usado por dois lugares
   do original — legenda de curso e rodapé — e não tinha token equivalente).
3. `src/components/sections/Cursos.tsx` — legenda do curso troca `font-display text-body` por
   `font-sans text-caption`. Prova: `Cursos.test.tsx`.
4. `src/components/layout/Footer.tsx` — copyright troca `text-body` por `text-caption`, mantendo
   `text-brand`. Prova: `Footer.test.tsx`.

Nenhuma correção mudou conteúdo, cor de marca ou estrutura — só o token tipográfico aplicado, para
bater com o que a referência mede nos três lugares.

## Correção de rota — cor do rodapé (achado R-1 da review, 2026-08-29)

A primeira versão do item 3 também trocou a cor do rodapé, de `text-brand` para `text-neutral-ink`
(`#666666`), alegando ser o valor medido. **Estava errado e foi revertido na review.** Duas
medições independentes, feitas depois:

1. na captura versionada desta própria rodada, `referencia/home-1440.png` tem 188 pixels exatos
   `#24a2e0` na faixa do copyright (x 182–564, y 3409–3421) e nenhum `#666666`; o mesmo azul
   aparece em `referencia/home-375.png` (y 5410–5443);
2. medição direta no site ao vivo, em 375:
   `getComputedStyle(document.querySelector('#footer-info'))` devolve `color: rgb(36, 162, 224)`,
   `font-size: 14px`, `line-height: 23.8px`, `font-weight: 500`, `font-family: "Open Sans"`.

O **tamanho** corrigido (14px/23.8px) é o medido e fica; a **cor** do original é `#24a2e0`, e
`text-brand` volta. A exceção de contraste do rodapé em `e2e/a11y-exceptions.ts` volta junto para
`#24a2e0` sobre `#323232` (4.46:1) — no seletor, só o nome da classe de tamanho mudou
(`text-body` -> `text-caption`).

## Ratificação (D2 da spec)

Item 4 (ícone do menu mobile) é a única linha nova que fica como `divergência intencional`: por ser
justificativa nova, pedia ratificação explícita de João antes de entrar na matriz (as demais são
`corrigir`, já resolvidas em código, ou `fiel` confirmado).

**Ratificada por João em 2026-08-29T08:55:14Z.** A lista resumida foi apresentada no chat às
08:54:36Z (Task 3, Step 6 do plano), com a pergunta "Pode ratificar pra eu commitar (Step 8) e
seguir pro Task 4?"; a resposta foi "pode continuar e seguir pro task 4". É ratificação de lista,
na forma que D2 define — não leitura par a par das capturas.

Ressalva registrada na review de 2026-08-29 (achado R-3): a lista ratificada continha a alegação
errada de que a cor do rodapé medida era `#666666` (ver "Correção de rota" acima). A correção não
toca o item 4 — a única linha que a ratificação precisava aprovar —, mas o registro fica: o que
João ratificou foi a lista de então, e esta rodada mudou o item 3 depois disso.
