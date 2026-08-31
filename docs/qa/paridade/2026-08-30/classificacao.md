# Classificação de diferenças — rodada 2026-08-30

> Evidência: `contact-sheet.html` desta pasta, confirmada por medição direta
> (`getBoundingClientRect`/`getComputedStyle`) contra `https://lotusotec.cl/` e o build de produção
> local — comparação visual do contact-sheet sozinha não decide diferença sutil (foi o caso do logo
> do cabeçalho em `1440` na rodada de 2026-08-29, descartado como falso-positivo depois de medição
> pixel a pixel). Capturas: `referencia/manifest.json` (`capturedAt: 2026-08-31T00:37:16.370Z`) e
> `clone/manifest.json` (`capturedAt: 2026-08-31T00:38:10.461Z`), cinco estados cada, sha256 por
> arquivo.
>
> Categorias: `layout`, `tipografia`, `spacing`, `asset`, `responsive`. Decisão: `fiel` (já
> reproduzido), `divergência intencional` (registrada na matriz) ou `corrigir` (não intencional).

| #   | estado            | categoria      | diferença observada                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | decisão                                                              | referência na matriz                                                                                       |
| --- | ----------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | 375/768/1440/1920 | tipografia     | As cinco faces self-hosted (`montserrat-400/500/700`, `open-sans-500/600`) passaram a ter arquivo próprio por peso; antes três eram bytes idênticos (`D-23`).                                                                                                                                                                                                                                                                                                                                                                                                               | `corrigir` (feito) — linha nova na matriz                            | `docs/inventario/README.md` — nova linha "Peso real das fontes self-hosted" (ver Task 13)                  |
| 2   | 375/768/1440/1920 | spacing        | Margens verticais do hero (kicker→h1→corpo→CTA) corrigidas de `mt-8` uniforme para os valores medidos (45/0/40/50px). Resíduo remanescente do hero (-18 a -75px) não tem causa de espaçamento aberta — ver "Resíduo de altura" abaixo.                                                                                                                                                                                                                                                                                                                                      | `corrigir` (feito)                                                   | `docs/inventario/README.md` — linha "Altura vertical das seções"                                           |
| 3   | (institucional)   | conteúdo       | Premissa de D4 (corpo institucional repartido em `<p>` na referência) **não se confirmou** — `#Somos p` alcança 6 nós (2 decorativos vazios, 3 dos destaques, 1 com o corpo institucional inteiro, sem quebra). `site.institucional.body` permanece `string`, sem mudança de estrutura.                                                                                                                                                                                                                                                                                     | `fiel` (já era) — D4 revogada por evidência                          | `docs/inventario/README.md` — linha "Institucional": nota de que D4 foi revista e revogada em 2026-08-30   |
| 4   | 375/768/1440/1920 | spacing        | Padding dos cards de destaque corrigido para `30px`/`10px` (era `0`/`mt-4`). Resíduo de `-26px`/card (bloco de ícone `lucide-react` vs `ETmodules`) é divergência intencional já aprovada (D8).                                                                                                                                                                                                                                                                                                                                                                             | `corrigir` (feito) + `divergência intencional` (ícone)               | `docs/inventario/README.md` — linha "Destaques": nota do bloco de ícone já existe                          |
| 5   | 375/768/1440/1920 | spacing        | Calha de cursos: `--spacing-gutter: 59.39px` estava certo para o eixo horizontal (desktop); faltava um valor diferente (`30px`) para o eixo vertical (mobile empilhado). Corrigido com `gap-x-gutter gap-y-7.5`, sem mudar o token.                                                                                                                                                                                                                                                                                                                                         | `corrigir` (feito) — D9 resolvida, sem contradição real              | `docs/inventario/05-layout.md` — nenhuma mudança de valor; nota de que os dois eixos são independentes     |
| 6   | 375/768/1440/1920 | spacing        | Padding responsivo de `cursos.linha`/`contacto.linha` corrigido para `30px` em 375/768 e `27px` em 1440/1920 (a referência usa valor diferente por breakpoint; o clone usava `27px` fixo).                                                                                                                                                                                                                                                                                                                                                                                  | `corrigir` (feito)                                                   | `docs/inventario/README.md` — linhas "Cursos" e "Contacto"                                                 |
| 7   | 375/768/1440/1920 | spacing        | Container do copyright do rodapé corrigido (`py-1.25` na `Row`); altura bate **exatamente** com a referência nas quatro larguras agora (delta `0`).                                                                                                                                                                                                                                                                                                                                                                                                                         | `corrigir` (feito)                                                   | `docs/inventario/README.md` — linha "Rodapé"                                                               |
| 8   | 768               | asset          | **Achado novo**: cards de curso usam imagem `w-full aspect-[4/3]` no clone (escala com a coluna), contra imagem de tamanho fixo `400×300px` centralizada na referência (Divi não escala a imagem além do tamanho original). Em colunas mais largas que 400px (768/1440/1920), a imagem do clone fica desproporcionalmente maior, inflando a altura do card. Efeito visível principalmente em 768 (coluna de 614px, imagem do clone vai a 460px de altura contra 300px fixos da referência) — é a causa isolada da inversão de sinal do resíduo nesse viewport (ver abaixo). | `corrigir` — **fora deste bloco**, é `asset`/`layout`, não `spacing` | `docs/inventario/README.md` — nova ressalva na linha "Altura vertical das seções" + débito novo no backlog |
| 9   | 375/768/1440/1920 | acessibilidade | Task 8 deu `p-[30px]` ao card de destaque; o seletor que o axe gera para o texto `#747d88`/`#f0f0f0` (exceção já existente desde `5.1.1-5.3.2`, 3.66:1) mudou. Não é cor nova nem contraste novo — seletor de `e2e/a11y-exceptions.ts` atualizado.                                                                                                                                                                                                                                                                                                                          | `fiel` (já era, seletor corrigido)                                   | nenhuma — não é linha de matriz, é manutenção de exceção já catalogada                                     |
| 10  | —                 | performance    | Bytes reais de fonte (3 arquivos a mais) fizeram a Performance do Lighthouse cair de 99 para 97 e o LCP piorar +457ms (2112→2569ms). CLS sem mudança (0). Nenhuma otimização tentada (D10 do bloco `6.1.1-6.3.1`).                                                                                                                                                                                                                                                                                                                                                          | registrar — decisão de agir fica com João                            | `docs/qa/performance/2026-08-30/resumo-fontes-reais.md`                                                    |

## Resíduo de altura depois das correções

Medição de `document.body.scrollHeight` (Task 11), referência ao vivo × build de produção local:

| largura | referência 08-29 | referência 08-30 | clone 08-29 | clone 08-30 | Δ clone (08-29→08-30) | gap ref−clone 08-29 | gap ref−clone 08-30 |
| ------: | ---------------: | ---------------: | ----------: | ----------: | --------------------: | ------------------: | ------------------: |
|     375 |             5467 |             5463 |        4902 |        5127 |                  +225 |                 565 |                 336 |
|     768 |             4913 |             4909 |        4818 |        5014 |                  +196 |                  95 |                -105 |
|    1440 |             3441 |             3441 |        3109 |        3244 |                  +135 |                 332 |                 197 |
|    1920 |             3409 |             3409 |        3105 |        3240 |                  +135 |                 304 |                 169 |

O clone cresceu em altura nas quatro larguras (as correções de padding/margem SOMAM altura, de
propósito — o clone estava mais curto que a referência). Em 375/1440/1920 isso reduz o gap, como
esperado. **Em 768 o gap inverte de sinal**: o clone passa de 95px mais baixo para 105px mais alto
que a referência. Causa isolada por medição seção a seção (fresca, pós-Tasks 6-9, não a medição
pré-fix de `espacamento.json`):

| seção         | 375 (ref/clone)                                               | 768 (ref/clone)     | 1440 (ref/clone) | 1920 (ref/clone) | causa                                                                                                                                                                                                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------- | ------------------- | ---------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hero          | 772.0 / 696.4                                                 | 565.8 / 547.8       | 831.0 / 782.2    | 796.2 / 778.2    | resíduo pequeno (-18 a -76px) sem causa de espaçamento aberta; provavelmente quebra de linha/`line-height` residual do corpo, não investigado além do que a Task 6 já corrigiu                                                                                                                                                                           |
| institucional | 1974.2 / 1819.1                                               | 1875.1 / 1495.3     | 864.7 / 791.0    | 864.7 / 791.0    | resíduo do bloco de destaques (icon `lucide-react` vs `ETmodules`, D8, `-26px`/card intencional) e de tipografia não medida nó a nó além do que as Tasks 5-8 cobriram                                                                                                                                                                                    |
| **cursos**    | 1628.2 / 1506.2                                               | **1519.6 / 2029.9** | 809.2 / 750.1    | 807.2 / 750.1    | **item #8 da tabela acima**: imagem full-width no clone contra imagem `400×300px` fixa na referência — em 768 a coluna (614px) é bem mais larga que 400px, inflando a altura do card em ~150-200px cada, ×3 cards. Em 375 a coluna já é estreita o bastante para o clone ficar menor; em 1440/1920 a proporção de imagem por card já não domina o total. |
| contacto      | 1010.1 / 949.0                                                | 893.5 / 808.0       | 866.7 / 773.2    | 866.7 / 773.2    | resíduo residual pequeno, dentro da margem do que já foi corrigido pela Task 9                                                                                                                                                                                                                                                                           |
| rodapé        | (medido à parte, ver item #7 — delta `0` nas quatro larguras) |

**A inversão em 768 tem causa isolada e nomeada** (item #8, imagem de curso não escalada corretamente) — não é resíduo "não classificável". A correção de imagem fica fora deste bloco (é `asset`/`layout`, o bloco corrigiu `spacing`), registrada como débito novo no backlog (Task 13).

## Peso real das fontes

As cinco faces de `src/assets/fonts/` (Task 1) passaram a ter `sha256` distinto por peso —
`montserrat-500`/`700` e `open-sans-600` deixaram de ser cópias de `montserrat-400`/`open-sans-500`.
Visualmente, `font-semibold`/`font-bold` (usados no `h1` do hero, títulos de seção, CTA) passam a
renderizar com traço mais grosso — antes usavam o desenho do peso 400 pintado sob a declaração
errada. Preload corrigido (Task 2) para apontar à face que o elemento do LCP (`h1#hero-heading`,
`font-bold`) realmente carrega (`montserrat-700`, não mais `montserrat-400`). Custo: Performance
99→97, LCP +457ms (item #10 da tabela).

## Divergência entre medições

Duas divergências entre leituras diferentes do repositório apareceram neste bloco — as duas foram
**resolvidas com medição adicional**, nenhuma ficou em aberto:

1. **Calha de cursos (D9)** — `docs/inventario/05-layout.md` (`--spacing-gutter: 59.39px`) e a
   review de 2026-08-29 (30px) não se contradiziam: medem eixos diferentes (horizontal desktop vs.
   vertical mobile). Ver `docs/qa/paridade/2026-08-30/espacamento.md`, seção "RESOLVIDA".
2. **Corpo institucional (D4)** — a leitura a olho de 2026-08-29 (parágrafos separados, ~19px) não
   se confirmou na medição por seletor de 2026-08-30 (`<p>` único). João revogou a decisão D4;
   Task 7 do plano não rodou.

## Ratificação (D7 da spec)

**Ratificada por João em 2026-08-30.** O harness não carimba timestamp de ISO exato por resposta
de chat; a janela real é limitada pelos commits adjacentes — depois de `b43bfac`
(`2026-08-30T21:39:25-03:00`, Task 11) e antes de `0435005` (`2026-08-30T21:47:57-03:00`, este
commit). Resumo apresentado no chat com os dez itens da tabela acima
(fontes reais, hero, revogação de D4, destaques, calha de cursos/D9, padding responsivo,
rodapé exato, achado novo de imagem de curso em 768px como débito separado, fix de seletor a11y,
e a regressão de performance registrada sem correção). Pergunta feita: "Ratifica a lista pra eu
seguir pra Task 13 (matriz/homologação/backlog)?"; resposta: **"Ratifico a lista inteira"** —
aprova os itens 1-9 como classificados e aceita o item 8 (imagem dos cards de curso) como débito
novo para bloco separado, não corrigido aqui. É ratificação de lista (D7), não leitura par a par
das capturas.

## Adendo pós-ratificação — achados da review (2026-08-31)

A tabela acima e a ratificação de D7 ficam como estão: o que segue foi levantado depois, pela review
independente do bloco, e não altera item ratificado.

- **`cursos.secao` tem `marginBottom: -105px` na referência e `0` no clone**, nas quatro larguras
  (`espacamento.json`; adendo em `espacamento.md`). É a maior divergência de espaçamento que
  permaneceu depois das Tasks 6-9 e não estava nomeada nesta classificação. Contribui em todas as
  larguras — inclusive em 768, onde a inversão de sinal do resíduo continua tendo o item 8 (imagem
  do card de curso, `D-28`) como causa dominante, mas não como causa única. **Reproduzida em
  2026-08-31 por decisão de João** (`-mb-26.25`): medição adicional mostrou que a margem cancela
  105 dos 110px de `paddingBottom` de `#Cursos` — `#Contacto` começa 5px depois da linha do CTA, sem
  sobrepor conteúdo, com o mesmo fundo nas duas seções. `D-29` fechada.
- **`contacto.linha` tem `marginBottom: 9px` na referência e `0` no clone**, nas quatro larguras.
  O clone produzia a mesma altura com um `<div className="h-2.25" />` separador — altura certa pela
  propriedade errada, o mesmo defeito do `py-1.25` do rodapé. Trocado por `mb-2.25` na linha, com o
  separador removido. `D-29` fechada.
- **Padding horizontal do card de destaque medido** (achado C-4): a referência usa `30px` nos quatro
  lados, nas quatro larguras — `p-[30px]` confirmado por medição, sem mudança de código.
- **Padding do container do copyright corrigido** (achado C-1): a referência usa `paddingTop 0` e
  `paddingBottom 10px`; o clone reproduzia a altura total com `py-1.25` simétrico (5px/5px). Trocado
  por `pb-2.5`, que reproduz o valor medido em vez de compensá-lo.

## Adendo pós-ratificação — achados da lente Codex (2026-08-31)

Review independente do Codex sobre `2094db3...80f5afd`. Achados materiais, todos conferidos no
código antes de aceitos:

- **`R-1` — o runner engolia seletor ambíguo.** `scripts/qa/medir-espacamento.mjs` capturava a
  exceção de `medirNo`, gravava `null` e terminava com exit 0, o que contraria D6 da spec e o aceite
  da Task 4 ("seletor ambíguo faz o script falhar"). Corrigido: `medirNo` distingue seletor ambíguo
  (`> 1` nó, derruba a medição) de seletor ausente (`0` nós, vira linha `ausente na …`), e o runner
  só engole o segundo caso.
- **`R-4` — dois paddings medidos do hero não tinham sido aplicados.** `hero.titulo` e
  `hero.subtitulo` medem `paddingBottom: 10px` na referência contra `0` no clone, nas quatro
  larguras. Aplicados (`pb-2.5` nos dois nós). O resíduo do hero declarado no item 2 e na tabela de
  resíduo (`-18` a `-76px`) encolhe 20px por coluna de texto; o restante continua sem causa de
  espaçamento aberta.
- **`R-2`, `R-3` e `R-5`** coincidem com os achados `C-4`, `C-2` e `C-1` da lente Claude e estão
  tratados nos adendos acima. `R-3` (margem de `-105px` em `#Cursos`) foi resolvida junto com `C-2`
  em 2026-08-31, por decisão de João de reproduzir a margem.

## Resíduo de altura depois da review (2026-08-31)

`document.body.scrollHeight`, referência ao vivo × build de produção local, medido depois de `C-1`,
`C-2`, `R-1` e `R-4`:

| largura | referência | clone pós-Task 11 | clone pós-review | Δ clone | gap ref−clone pós-Task 11 | gap ref−clone pós-review |
| ------: | ---------: | ----------------: | ---------------: | ------: | ------------------------: | -----------------------: |
|     375 |       5467 |              5127 |             5042 |     -85 |                       336 |                      425 |
|     768 |       4913 |              5014 |             4929 |     -85 |                      -105 |                      -16 |
|    1440 |       3441 |              3244 |             3159 |     -85 |                       197 |                      282 |
|    1920 |       3409 |              3240 |             3155 |     -85 |                       169 |                      254 |

O clone encurtou 85px em todas as larguras: `-105px` da margem de `#Cursos` e `+20px` dos dois
`paddingBottom: 10px` do hero (`R-4`). **O gap total cresce em 375/1440/1920 e isso é esperado**,
não regressão: por D3 da spec a paridade é por elemento medido, e altura total é consequência. Os
dois elementos corrigidos passaram a bater com a referência; o gap que sobra pertence ao resíduo já
nomeado (bloco de ícone dos destaques com `D8` aprovado, imagem dos cards de curso com `D-28`, e
resíduo de `line-height` do hero sem causa de espaçamento aberta).

Em 768 o gap cai de `-105` para `-16`, mas **isso não é paridade de altura**: é compensação entre
dois erros de sinal contrário — `D-28` continua inflando os cards de curso nessa largura, e a margem
correta de `#Cursos` passou a descontar quase o mesmo tanto. A leitura válida ali continua sendo a
medição elemento a elemento, não o total.
