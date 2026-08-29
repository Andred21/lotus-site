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

| #   | estado            | categoria  | diferença observada                                                                                                                                                                                                                                                                                                                                                                                                                                                    | decisão                            | referência na matriz                                                                                                                                                                               |
| --- | ----------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 375/768/1440/1920 | tipografia | Corpo dos três destaques (`ENERGIZADAS`/`ALUMNOS`/`CERTIFICACIÓN`) media Open Sans 19px/34.2px (`text-lead`) no clone contra Montserrat 16px/28.8px medido na referência.                                                                                                                                                                                                                                                                                              | `corrigir`                         | `docs/inventario/README.md` — linha "Institucional" (o corpo do destaque não é o parágrafo institucional acima; tipografias distintas, confundidas em `Destaques.tsx`)                             |
| 2   | 375/768/1440/1920 | tipografia | Legenda dos três cards de curso media Montserrat 16px/28.8px (`text-body`) no clone contra Open Sans 14px/23.8px medido na referência.                                                                                                                                                                                                                                                                                                                                 | `corrigir`                         | idem — mesma tipografia do rodapé (item 3), não catalogada como token antes desta rodada                                                                                                           |
| 3   | 375/768/1440/1920 | tipografia | Rodapé media Open Sans 16px/28.8px em azul `text-brand` no clone contra Open Sans 14px/23.8px em cinza `#666666` (`--color-neutral-ink`) medido na referência.                                                                                                                                                                                                                                                                                                         | `corrigir`                         | `docs/inventario/README.md` — linha "Rodapé" (`fiel`, mas só cobria o texto do copyright em si, não a tipografia medida; ano `2022` preservado, tipografia agora também)                           |
| 4   | 375-menu          | asset      | Ícone do menu mobile alterna de hamburger para `×` e ganha `aria-label` (`Abrir menú`/`Cerrar menú`) ao abrir; o original mantém o mesmo ícone e não expõe `aria-label` no toggle (confirmado: classe do botão não muda ao clicar, `aria-label` é `null`).                                                                                                                                                                                                             | `divergência intencional`          | nova — acessibilidade do menu mobile decidida no bloco `5.1.1-5.3.2`; feedback de estado aberto/fechado sem equivalente medido no original, coberto por `e2e/menu.spec.ts` e `e2e/teclado.spec.ts` |
| —   | 1440/1920         | asset      | Logo do cabeçalho aparenta "esmaecido"/maior no clone ao comparar as duas capturas do `contact-sheet`. Medido pixel-a-pixel (`naturalWidth/Height`, `renderedWidth/Height`, `top`, `left`, `headerHeight`): **idêntico** nas duas pontas (mesmo arquivo, mesmo `205×258` natural, `~63×80` renderizado, `top≈7px`, `headerHeight=94px`). Artefato do redimensionamento da própria captura de tela ao ser exibida em duas escalas diferentes, não uma divergência real. | `fiel` (falso-positivo descartado) | `docs/inventario/README.md` — linha "Favicon e ícones" / logo do cabeçalho já medido em sprints anteriores                                                                                         |

## Observação aberta — altura total em 375px (não é diferença classificável)

Altura total da página em 375px: referência `5467px`, clone `5036px` antes da correção dos itens
1–3, `4902px` depois. A correção **não** fechou a diferença — ao contrário, reduziu ainda mais a
altura do clone (as fontes corrigidas para o valor medido são menores que as antigas usadas
indevidamente), então a causa do `~565px` restante está em outro lugar, não isolado dentro do escopo
desta rodada.

Isso não é uma "diferença observada" no sentido da tabela acima — é um agregado de toda a página, não
um elemento único que se possa marcar `fiel`/`divergência intencional`/`corrigir`. Não há defeito
visual observável (sem corte de conteúdo, sem sobreposição; `e2e/home.spec.ts` continua provando
ausência de rolagem horizontal nas quatro larguras) e os elementos verificados individualmente nesta
rodada — cabeçalho, navegação, hero, parágrafo institucional, formulário — bateram com a referência.
O candidato mais provável para parte do resíduo já é divergência aprovada ("Menu duplicado no DOM" e
"Estado sticky do cabeçalho" em `docs/inventario/README.md` descrevem um elemento extra no fluxo do
original que o clone não reproduz), mas a atribuição exata não foi medida.

Não bloqueia o fechamento desta EAP — não é um item da matriz, e nenhum item que a matriz registra
fica como `pendente decisão`. Registrado como **débito novo** para a homologação (`6.3.1`): medir a
origem exata do resíduo de altura em 375px, se e quando isso importar (ex.: relato de discrepância
percebida por João ou nova rodada de paridade).

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
4. `src/components/layout/Footer.tsx` — copyright troca `text-body`/`text-brand` por
   `text-caption`/`text-neutral-ink`. Prova: `Footer.test.tsx`.

Nenhuma correção mudou conteúdo, cor de marca ou estrutura — só o token tipográfico aplicado, para
bater com o que a referência mede nos três lugares.

## Pendente de ratificação (D2 da spec)

Item 4 (ícone do menu mobile) é a única linha nova que fica como `divergência intencional`: pede
ratificação explícita de João antes de entrar na matriz, por ser justificativa nova (as demais são
`corrigir`, já resolvidas em código, ou `fiel` confirmado).
