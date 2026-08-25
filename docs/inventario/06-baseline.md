# 06 — Baseline visual

> Evidência: `docs/inventario/baseline/*.png`, gerado por `pnpm inventario:baseline` (usa `openPage`/`VIEWPORTS` de `lib/site.mjs`). Commit-base: `2a5e88c`.

## Como foi gerado

```bash
pnpm inventario:baseline
```

O script abre a home nos 4 viewports do inventário, rola a página inteira (dispara o lazy-load do Divi) e tira uma captura `fullPage`. Em `375px`, depois da captura normal, clica no toggle do menu mobile (`.mobile_menu_bar`) e tira uma segunda captura, não full-page, com o menu aberto.

## Arquivos

| arquivo             | viewport | altura capturada | peso        |
| ------------------- | -------- | ---------------- | ----------- |
| `home-375.png`      | 375px    | 5467px           | 418 063 B   |
| `home-375-menu.png` | 375px    | viewport (812px) | 27 210 B    |
| `home-768.png`      | 768px    | 4913px           | 446 187 B   |
| `home-1440.png`     | 1440px   | 3441px           | 1 292 314 B |
| `home-1920.png`     | 1920px   | 3409px           | 1 490 055 B |

A altura da página cai de `5467px`/`4913px` (mobile/tablet) para `~3400px` (desktop) porque `Somos` e `Cursos` deixam de empilhar conteúdo verticalmente — ver `05-layout.md` para a altura por seção.

## O que muda entre viewports

- **Foto do hero**: a fotografia do trabalhador na torre de energia só aparece em `1440`/`1920`, ocupando a metade direita do hero. Em `375`/`768` o hero é só o bloco preto com texto — a foto não aparece em lugar nenhum da página, não é reposicionada.
- **Menu**: vira hambúrguer em `375`/`768` (confirma o achado de `05-layout.md`: `top-menu` mede `0×0` nesses dois viewports); em `1440`/`1920` os 4 itens ficam visíveis na barra superior.
- **`Somos`**: 2 colunas lado a lado (logo + texto institucional | 3 estatísticas em linha) em `1440`/`1920`; empilha em coluna única (logo, texto, depois as 3 estatísticas uma abaixo da outra) em `375`/`768`.
- **`Cursos`**: os 3 cards ficam em linha em `1440`/`1920` e empilhados em `375`/`768`.
- **Container**: em `1440`/`1920` dá para ver a faixa clara/escura de fundo (`Somos`/`Cursos`/`Contacto`) mais larga que o bloco de conteúdo centralizado em `1080px` (ver `05-layout.md`); em `375`/`768` o conteúdo ocupa a largura inteira, sem faixa visível.
- **CTAs `Learn More` e `See More`**: não aparecem visíveis em nenhum dos 4 baselines — confirma visualmente o achado de `04-tipografia.md` (cor de texto, fundo e borda medidos como `rgb(0, 0, 0)`, os três idênticos): o botão do hero e o "ver mais" dos cursos estão, hoje, invisíveis no site publicado, não só nos valores computados.
- **Formulário**: os placeholders (`Nombre Completo`, `Correo Electrónico`, `Empresa`, `Mensaje`) aparecem visualmente como rótulos estáticos acima de uma linha — mas são `placeholder` (`02-conteudo.md`), então esse texto some ao digitar; isso não é visível numa captura estática, só ao interagir.

## Estado `home-375-menu.png`

Existe porque o menu mobile só aparece via clique — uma captura `fullPage` normal nunca mostraria os 4 itens do menu (`Inicio`, `Quienes Somos`, `Cursos`, `Contacto`) abertos. A captura confirma visualmente a lista de itens já extraída em `01-estrutura.md`/`02-conteudo.md` e mostra a ordem em que aparecem (empilhados, com o logo por trás, parcialmente coberto pelo dropdown).

## Ressalva

Este baseline é referência humana para a Sprint 2 comparar contra o clone — não é teste de diff automático de pixel. O Playwright deste repositório cobre só Chromium (`playwright.config.ts`), e o clone que será comparado contra este baseline ainda não existe; nenhuma suíte de regressão visual roda hoje contra estes arquivos.
