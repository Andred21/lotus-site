# 06 — Baseline visual

> Evidência: `docs/inventario/baseline/*.png`, recapturado em `2026-10-11` por `pnpm inventario:baseline` (usa `openPage`/`VIEWPORTS`/`capturarPaginaInteira` de `lib/site.mjs`) contra o WordPress em `185.146.167.195`. `sha256` de cada captura: `home-375.png` `43d878a8f3efcdba…`, `home-375-menu.png` `7463bc13504d256f…`, `home-768.png` `1b836a7dce7cf812…`, `home-1440.png` `cefef084d61cb6c5…`, `home-1920.png` `f113a5dafbad6483…`. A captura original, de `2026-08-25`, fica no histórico Git (`92906d2`); a comparação entre as duas está em "Recaptura de 2026-10-11", abaixo.

## Como foi gerado

```bash
pnpm inventario:baseline
```

O script abre a home nos 4 viewports do inventário e rola a página inteira (dispara o lazy-load do Divi). Desde o corte de `2026-10-05`, `lotusotec.cl` entrega o clone pela CloudFront: o Chromium resolve `lotusotec.cl` para o IP do WordPress (`--host-resolver-rules`), com URL, Host e SNI intactos, e a captura reprova se a resposta vier da CloudFront.

A captura de página inteira é composta: o screenshot `fullPage` do Playwright redesenha o cabeçalho desktop do Divi em outro estado (fundo `#f8f8f8`, logo pequeno; `D-30`), então as linhas da altura do viewport vêm de um screenshot de viewport tirado na mesma página, com a rolagem já no topo, e o resto vem do `fullPage`. Em `375px`, depois da captura normal, o script clica no toggle do menu mobile (`.mobile_menu_bar`) e tira uma segunda captura, só do viewport, com o menu aberto.

## Arquivos

| arquivo             | viewport | altura capturada | peso        |
| ------------------- | -------- | ---------------- | ----------- |
| `home-375.png`      | 375px    | 5467px           | 609 373 B   |
| `home-375-menu.png` | 375px    | viewport (812px) | 27 210 B    |
| `home-768.png`      | 768px    | 4913px           | 653 520 B   |
| `home-1440.png`     | 1440px   | 3441px           | 1 820 853 B |
| `home-1920.png`     | 1920px   | 3409px           | 2 125 661 B |

O peso subiu em relação à captura de `2026-08-25` porque a composição reencoda o PNG pelo canvas do Chromium, que comprime menos que o screenshot do Playwright; os pixels são os mesmos fora do cabeçalho (abaixo).

A altura da página cai de `5467px`/`4913px` (mobile/tablet) para `~3400px` (desktop) porque `Somos` e `Cursos` deixam de empilhar conteúdo verticalmente — ver `05-layout.md` para a altura por seção.

## O que muda entre viewports

- **Foto do hero**: a fotografia do trabalhador na torre de energia (`staging-shutterstock_1444636373-1-scaled.jpg`, aplicada como `background-image`, ver `03-assets.md`) só aparece em `1440`/`1920`, ocupando a metade direita do hero. Em `375`/`768` o hero é só o bloco preto com texto — a foto não aparece em lugar nenhum da página, não é reposicionada.
- **Menu**: vira hambúrguer em `375`/`768` (confirma o achado de `05-layout.md`: `top-menu` mede `0×0` nesses dois viewports); em `1440`/`1920` os 4 itens ficam visíveis na barra superior.
- **`Somos`**: duas linhas Divi em `1440`/`1920` — a primeira com logo (`320px`) e texto institucional (`700px`) lado a lado, a segunda com as 3 estatísticas em três colunas de `320px` (ver `05-layout.md`); tudo empilha em coluna única em `375`/`768`.
- **`Cursos`**: os 3 cards ficam em linha em `1440`/`1920` e empilhados em `375`/`768`.
- **Container**: em `1440`/`1920` dá para ver a faixa clara/escura de fundo (`Somos`/`Cursos`/`Contacto`) mais larga que o bloco de conteúdo centralizado em `1080px` (ver `05-layout.md`); em `375`/`768` o conteúdo ocupa a largura inteira, sem faixa visível.
- **CTAs `Learn More` e `See More`**: não aparecem visíveis em nenhum dos 4 baselines — confirma visualmente o achado de `04-tipografia.md` (cor de texto, fundo e borda medidos como `rgb(0, 0, 0)`, os três idênticos): o botão do hero e o "ver mais" dos cursos estão, hoje, invisíveis no site publicado, não só nos valores computados.
- **Formulário**: os placeholders (`Nombre Completo`, `Correo Electrónico`, `Empresa`, `Mensaje`) aparecem visualmente como rótulos estáticos acima de uma linha — mas são `placeholder` (`02-conteudo.md`), então esse texto some ao digitar; isso não é visível numa captura estática, só ao interagir.

## Estado `home-375-menu.png`

Existe porque o menu mobile só aparece via clique — uma captura `fullPage` normal nunca mostraria os 4 itens do menu (`Inicio`, `Quienes Somos`, `Cursos`, `Contacto`) abertos. A captura confirma visualmente a lista de itens já extraída em `01-estrutura.md`/`02-conteudo.md` e mostra a ordem em que aparecem (empilhados, com o logo por trás, parcialmente coberto pelo dropdown).

## Recaptura de 2026-10-11

`node scripts/inventario/comparar-png.mjs <antigo> <novo>`, com o antigo extraído de `92906d2` (`git show 92906d2:docs/inventario/baseline/home-1440.png > /tmp/home-1440.png`):

| arquivo             | dimensões       | pixels diferentes | faixas                |
| ------------------- | --------------- | ----------------- | --------------------- |
| `home-375.png`      | 375×5467 nos 2  | 0                 | —                     |
| `home-375-menu.png` | 375×812 nos 2   | 0                 | — (bytes iguais)      |
| `home-768.png`      | 768×4913 nos 2  | 0                 | —                     |
| `home-1440.png`     | 1440×3441 nos 2 | 134 794           | linhas 0–93, x 0–1439 |
| `home-1920.png`     | 1920×3409 nos 2 | 179 914           | linhas 0–93, x 0–1919 |

A diferença inteira é a faixa do cabeçalho desktop, a que `D-30` previa: o resto da página, inclusive o hero e o mobile, é pixel a pixel o da captura de agosto. O WordPress não mudou entre as duas datas, e o defeito era só da captura.

Achado da execução: o WordPress declara `scroll-behavior: smooth`, e o `scrollTo(0, 0)` de `openPage` ainda está animando 1 s depois em `375px` (`scrollY` 28) e `768px` (`scrollY` 1). O `fullPage` não sente isso, mas o screenshot de viewport sim; `capturarPaginaInteira` espera `scrollY === 0` antes de tirá-lo.

## Ressalva

Este baseline é referência humana para a Sprint 2 comparar contra o clone — não é teste de diff automático de pixel. O Playwright deste repositório cobre só Chromium (`playwright.config.ts`), e o clone que será comparado contra este baseline ainda não existe; nenhuma suíte de regressão visual roda hoje contra estes arquivos.
