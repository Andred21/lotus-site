# Bounded design — `recaptura-baseline`

- **Origem:** bloco `B8` do backlog, selecionado por João em 2026-10-11 com `/planejar-site`.
  Fecha `D-30` e destrava a PENDÊNCIA 4 (conferência humana de paridade).
- **Status:** aprovado por João em 2026-10-11. `docs/superpowers/state.md` em
  `ready_for_execution`, branch `fix/recaptura-baseline`, base `main@92906d2`.
- **Não é spec nem plano:** o bloco é `bounded`; este arquivo é o `bounded_design` que
  `/executar-site` consome e a memória durável das medições do planejamento.
- **Context packet:** `null`, como em `paridade-header-cursos`. A única fonte externa é o
  WordPress, sondado direto no planejamento (abaixo). A skill `site-context-packet` manda ler
  `https://lotusotec.cl/`, que desde o corte de 2026-10-05 entrega o clone.

## Decisões de João (2026-10-11)

1. **O bloco termina na folha de contato.** Recaptura, paleta reamostrada e uma rodada datada
   referência × clone; João confere e o veredito entra no fechamento. Divergência que a
   conferência achar vira débito novo, não correção dentro do bloco.
2. **O lado clone é a produção**, `https://lotusotec.cl/` pela distribuição, com o sha do release
   no ar registrado.

## Medições do planejamento (2026-10-11)

Sondas descartáveis, fora do repositório, com Playwright `1.62.1` e Node `24.19.0`.

### A referência mudou de endereço

| alvo                                          | resposta                           |
| --------------------------------------------- | ---------------------------------- |
| `https://lotusotec.cl/`                       | `HTTP/2 200`, `server: CloudFront` |
| `https://lotusotec.cl/` via `185.146.167.195` | `HTTP/2 200`, `server: Apache`     |

O certificado do WordPress em `185.146.167.195` vale até `2026-11-10T20:37:55Z`
(`docs/infra/rollback-corte.md` §0). Consequência: `SITE_URL` em
`scripts/inventario/lib/site.mjs:5` resolve hoje para o clone, sem erro nenhum. Isso alcança
`openPage` (usado por `capture-baseline`, `extract-dom`, `extract-styles`, `measure-breakpoints` e
`scripts/qa/capture-referencia.mjs`) e os dois scripts que abrem `SITE_URL` com navegador próprio,
`scripts/qa/medir-espacamento.mjs:23` e `scripts/qa/medir-header-cursos.mjs:83`. Uma recaptura sem
correção compararia o clone com ele mesmo.

### `D-30` reproduzido e delimitado

Contra o WordPress pelo IP, mesmo pré-processo de `openPage` (`load`, rolagem inteira, volta ao
topo, 1 s), comparação pixel a pixel:

| largura | `fullPage` × viewport alto (altura do documento)       | viewport normal × `fullPage`, 900 px do topo |
| ------- | ------------------------------------------------------ | -------------------------------------------- |
| 375     | 0 px diferentes                                        | —                                            |
| 768     | 0 px diferentes                                        | —                                            |
| 1440    | uma faixa, linhas 0–923 (cabeçalho + hero), 731 974 px | uma faixa, linhas 0–93, largura inteira      |
| 1920    | uma faixa, linhas 0–890 (cabeçalho + hero), 944 228 px | não medido                                   |

Leitura:

- O screenshot de viewport normal é a verdade do topo: cabeçalho `#000000`, logo `LOTUS` grande.
- O `fullPage` erra **só a faixa do cabeçalho** (linhas 0–93 em 1440): fundo `#f8f8f8` e o logo em
  outro estado, menor e com o texto quase invisível. O hero sai idêntico ao viewport normal.
- O viewport alto acerta o cabeçalho mas reenquadra a foto do hero, porque o
  `span.et_pb_parallax_bg` do Divi dimensiona o fundo pela altura da janela. Não serve de correção.
- Abaixo do hero, `fullPage` e viewport alto concordam pixel a pixel: dois métodos distintos dão o
  mesmo resultado, o que sustenta que o resto da paleta dos PNG antigos está certo. A reamostragem
  do bloco confirma ou desmente.
- Geometria igual à de 2026-08-25: `3441px` de altura em 1440, seções nas mesmas posições, então as
  coordenadas de `sample-baseline.mjs` continuam valendo.

### Capturas históricas são quase determinísticas

`home-1440`, `home-768` e `home-375` saíram byte a byte iguais em 2026-08-25, 2026-08-29 e
2026-08-30; `home-1920` e `home-375-menu` variaram uma vez. Igualdade de bytes entre o baseline e
a referência da rodada nova é observação, não gate.

## Desenho

### 1. As capturas voltam a mirar o WordPress — `scripts/inventario/lib/site.mjs`

- Constante com o IP `185.146.167.195`, com comentário apontando `infra/rollback-corte.json`.
  Lançamento do Chromium com `--host-resolver-rules=MAP lotusotec.cl <ip>, MAP www.lotusotec.cl
<ip>` (padrão de `e2e/smoke/alvo.ts` e `scripts/wordpress/verificar-restauracao.mjs`). URL, Host e
  SNI continuam `lotusotec.cl`; o certificado valida sem `ignoreHTTPSErrors`, e depois de
  2026-11-10 o script falha por TLS em vez de medir errado.
- Guarda pura `exigirWordPress` sobre os cabeçalhos da resposta do `goto`: `server` com
  `CloudFront` reprova com mensagem que diga que a referência não é o WordPress. Coberta em
  `site.test.mjs`.
- O lançamento e a guarda são exportados. `openPage` usa os dois; `medir-espacamento.mjs` e
  `medir-header-cursos.mjs` trocam `chromium.launch()` pelo lançamento exportado e chamam a guarda
  depois do `goto` da referência. O clone deles continua em `localhost`, que a regra não toca.
- O docstring de `cssColor` perde a afirmação de que o cabeçalho mede `rgba(0, 0, 0, 0.03)`, que
  não reproduz (`D-31`, parte do docstring). `rgbToHex` não muda: é o candidato 5 de `B9`.

### 2. Captura de página inteira fiel

- Função compartilhada em `lib/site.mjs`: na mesma página, tira o screenshot de viewport e o
  `fullPage`, e compõe num canvas o viewport sobre as linhas `[0, altura do viewport)` e o
  `fullPage` no resto. Decodificação por data URI, como `sample-baseline.mjs` já faz. Nenhuma
  dependência nova.
- `capture-baseline.mjs`, `scripts/qa/capture-referencia.mjs` e `scripts/qa/capture-clone.mjs`
  passam a capturar por ela, para os dois lados ficarem nas mesmas condições. O estado de menu
  aberto em 375 continua screenshot de viewport.
- `scripts/inventario/comparar-png.mjs <a> <b>`: imprime as faixas de linha em que dois PNG
  divergem, com contagem de pixels e extensão horizontal. Offline: continua reproduzível depois que
  o WordPress sair do ar.

### 3. Material

- Recaptura dos cinco PNG de `docs/inventario/baseline/` e atualização dos `sha256` em
  `06-baseline.md`, que `scripts/inventario/inventario.test.mjs` obriga; a secção "Como foi gerado"
  passa a descrever a composição e o alvo por IP.
- Comparação antigo × novo com `comparar-png.mjs`, registrada em `06-baseline.md`.
- Reamostragem com `sample-baseline.mjs`: a dica de fundo de `menu-link` vai de `#f8f8f8` para
  `#000000`; as saídas antiga e nova entram em `04-tipografia.md`, e o parágrafo "Os cinco PNG de
  `baseline/` ainda carregam o artefato" deixa de valer.
- Rodada nova em `docs/qa/paridade/<data da execução>/`: `RUN_DIR` em `scripts/qa/lib/paridade.mjs`
  muda; `qa:referencia` contra o WordPress pelo IP, `qa:clone` com
  `CLONE_URL=https://lotusotec.cl/` e `qa:contact-sheet`. O sha do release no ar fica registrado na
  rodada, conferido como o item 1 do smoke faz: `index.html` da raiz igual ao de
  `releases/<sha>/index.html`.

## Prova de aceite

Aceite específico antes dos gates genéricos:

1. Nos PNG novos de 1440 e 1920, o cabeçalho pinta `#000000` (`sample-baseline.mjs`,
   `header-fundo`/`menu-link`).
2. `comparar-png.mjs` antigo × novo: divergência confinada às linhas 0–93 em 1440 e 1920; zero em
   375 e 768. Qualquer outra faixa é achado e vai para o registro, não para debaixo do tapete.
3. `node scripts/qa/medir-header-cursos.mjs` contra o WordPress pelo IP e o build local servido na
   porta 5184 reproduz `docs/qa/paridade/2026-09-02/header-cursos.md` byte a byte (só o
   `capturadoEm` do `.json` pode diferir, e é revertido). Se a referência fosse o clone, a coluna
   referência mudaria — `boxShadow` do clone é outra string —, então isto prova o alvo.
4. A folha de contato da rodada nova existe e emparelha os cinco estados.
5. `pnpm check` verde. `pnpm e2e` não é exigido: `src/` não muda.

Limite declarado: `medir-espacamento.mjs` recebe o mesmo ajuste de lançamento e guarda de
`medir-header-cursos.mjs`, mas não é executado no bloco.

## Commits previstos

1. `fix(recaptura-baseline): mirar a referência no WordPress pelo IP` — lançamento, guarda e teste;
   `medir-*`; docstring de `cssColor`.
2. `fix(recaptura-baseline): compor a captura de página inteira com o topo do viewport` — função
   compartilhada, três capturas, `comparar-png.mjs`.
3. `docs(recaptura-baseline): recapturar os cinco PNG do baseline` — PNG, `06-baseline.md`,
   comparação antigo × novo.
4. `docs(recaptura-baseline): reamostrar a paleta sobre o baseline novo` — `sample-baseline.mjs`,
   `04-tipografia.md`, `README.md` se citar o artefato.
5. `docs(recaptura-baseline): rodada referência × clone para a conferência humana` — `RUN_DIR`,
   rodada nova, folha de contato, sha do release, prova 3.
6. `docs(recaptura-baseline): fechar D-30 e registrar a conferência pendente` — backlog.

O veredito de João sobre a folha de contato entra no fechamento.

## Fora do bloco

- `src/`: nenhuma mudança de produto. Divergência que a conferência achar vira débito.
- `D-16`: `styles.json` não é regerado.
- `rgbToHex` e o resto de `D-31`: `B9`.
- As rodadas `2026-08-29` e `2026-08-30`: ficam como histórico, com o artefato que já carregam.
- Espelho: `scripts/inventario/`, `scripts/qa/` e `docs/` estão em `.espelho-exclusoes`; nada
  deste bloco atravessa para o corporativo.

## Prazo

A execução depende do WordPress no ar: antes de 2026-11-10 e antes de `B7`. Depois disso, só
restaurando o backup localmente (`scripts/wordpress/verificar-restauracao.mjs`).
