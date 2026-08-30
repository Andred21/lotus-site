# Spec — `paridade-espacamento-fontes` · Paridade residual: espaçamento vertical, pesos de fonte reais e guarda de regressão

> Work item: `paridade-espacamento-fontes` · Branch: `fix/paridade-espacamento-fontes` · Base: `2094db3`
> Context Packet: nenhum (`context_packet: null`) — o contexto externo necessário é medição nova
> contra `https://lotusotec.cl/`, que é tarefa deste bloco, não fato compressível em packet.
> Matriz de paridade: [`docs/inventario/README.md`](../../inventario/README.md) · rodada anterior:
> [`docs/qa/paridade/2026-08-29/classificacao.md`](../../qa/paridade/2026-08-29/classificacao.md) ·
> homologação vigente: [`docs/qa/homologacao-2026-08-29.md`](../../qa/homologacao-2026-08-29.md)

## 1. Objetivo

Fechar as quatro divergências de paridade que a homologação de `6.3.1` deixou como ressalva:

- `D-23` — as cinco faces self-hosted são só três arquivos: `montserrat-400/500/700.woff2` têm
  `sha256` `06b16db7a969135d…` idêntico e `open-sans-500/600.woff2` têm `d8e4fe0452aa2076…`
  idêntico. Nenhum texto `font-medium`, `font-semibold` ou `font-bold` do clone renderiza com o
  glifo do peso que declara.
- `D-24` — o clone é mais curto que a referência em todas as larguras: 375 `-565px`, 768 `-95px`,
  1440 `-332px`, 1920 `-304px`. Causa já classificada como `spacing` e atribuída por seção.
- `D-25` — `e2e/regressao-visual.spec.ts` não declara projeto, cai em `chromium` (dev server, porta 5183) e portanto não guarda a mudança que existe para guardar: o `<link rel="preload">` injetado
  por `scripts/vite/preload-critical.mjs` só é produzido pelo build, servido pelo projeto `producao`
  na 5184.
- `D-26` — o peso real das fontes não tem linha na matriz de paridade, embora seja divergência
  visual contra o original.

Ao fim, a linha "Altura vertical das seções" sai de `pendente decisão` e a homologação perde essas
quatro ressalvas.

## 2. Escopo negativo

- Não redesenhar. Lei 1 continua valendo: divergência intencional só entra na matriz com decisão
  registrada.
- Não reconciliar o Notion. `D-01`, `D-08`, `D-09`, `D-12` e `D-13` seguem abertos; este bloco não
  tem EAP no Notion (D1) e não escreve lá.
- Não tocar `.claude/**` nem `.agents/**`: `D-15`, `D-18`, `D-19` e `D-27` são tarefa de harness
  própria.
- Não fechar `D-16` (`extract-styles.mjs:68` mede o nó-eco do Divi). Este bloco **evita** o defeito
  (D6) sem corrigi-lo, e não regenera `styles.json`.
- Não criar conta Web3Forms nem provar envio real (`D-17`).
- Não alterar `e2e/a11y-exceptions.ts` (`D-21`): as correções deste bloco não mudam cor.
- Não corrigir o resíduo do bloco de ícone dos destaques (D8): ele vem de divergência intencional já
  aprovada em 2026-08-25.
- Não instalar dependência nova. Nenhuma tarefa aqui precisa de uma (Lei 7).
- Não trocar formato de fonte (`woff2` fica), não adicionar face nova, não adicionar itálico.

## 3. Decisões

### D1 — Bloco sem EAP no Notion · `S-JOAO`

O trabalho vem dos débitos `D-23`, `D-24`, `D-25` e `D-26`, não do roadmap. Nenhuma página do data
source `collection://2f0e72ec-ef53-4e08-a466-312de7eea7d2` descreve estas correções: as tasks de
Sprint 5 (`6.1.1`–`6.3.1`) foram entregues e as de Sprint 6 em diante são deploy e pós-go-live.
`active_notion_eap` fica `null`, como no bloco `refactor-contato-intake`. Escrita no Notion continua
exigindo autorização explícita e não acontece aqui.

### D2 — Fonte antes de espaçamento, ordem obrigatória · `S-CLAUDE`

Peso de glifo altera largura de glifo; largura altera quebra de linha; quebra altera altura. A
tabela de resíduo mede, em 375, que o corpo do hero ocupa 6 linhas na referência e 4 no clone
(`classificacao.md:33`) — sintoma coerente com glifo mais estreito do que o declarado.

Corrigir espaçamento sobre fonte errada calibraria padding para compensar defeito de fonte, e os
valores ficariam errados assim que a fonte fosse corrigida. Logo: as tarefas de fonte fecham antes
de qualquer medição de espaçamento, e a medição de `D-24` roda sobre o clone já com as faces reais.

Consequência aceita: parte dos deltas de altura hoje atribuídos a `spacing` pode desaparecer com a
fonte. A medição da tarefa 4 é a autoridade sobre quanto sobra — os números de 2026-08-29 são
hipótese de partida, não alvo.

### D3 — Aceite de `D-24` é paridade por elemento medido · `S-JOAO`

Decisão de João em 2026-08-30. O critério é: cada padding, margem e quebra de parágrafo corrigido
bate com o valor medido na referência. A altura total da página é **consequência**, não meta, e não
existe tolerância numérica de altura no aceite.

Alternativas descartadas na conversa: meta de altura total com tolerância (permite erro compensar
erro — padding errado num lugar cancelando outro, com altura verde sobre layout errado) e delta zero
de altura (impossível sem reabrir a divergência intencional dos ícones, D8).

O resíduo que sobrar depois das correções é medido, nomeado por seção e declarado na matriz.

### D4 — O texto institucional passa a ser array de parágrafos · `S-JOAO`

Decisão de João em 2026-08-30. `site.institucional.body` deixa de ser uma string e passa a ser uma
lista de parágrafos, **verbatim**: nenhuma palavra, pontuação ou caixa muda; só a fronteira entre
parágrafos, que a referência marca com `<p>` separados e ~19px entre eles.

Consequências: `QuienesSomos.tsx` passa a renderizar um `<p>` por item; `App.test.tsx` e o teste da
seção passam a afirmar a contagem de parágrafos; a linha "Institucional" da matriz, hoje `fiel`,
ganha a nota da mudança estrutural. O ponto de corte entre parágrafos é o medido na referência, não
escolha de redação.

### D5 — Aquisição de fonte é evento único, guardada por teste · `S-CLAUDE`

Os três arquivos que faltam (`Montserrat` 500, `Montserrat` 700, `Open Sans` 600, subset `latin`)
são baixados uma vez e versionados. Não nasce script de download: baixar fonte não é operação
recorrente do projeto, e um script novo custaria entrada em `tsconfig.node.json`, teste próprio e
manutenção, sem consumidor futuro.

O que fica permanente é a catraca: teste unitário afirmando que os cinco `.woff2` de
`src/assets/fonts/` têm cinco `sha256` distintos. Hoje esse teste falha — é exatamente `D-23`. A
proveniência (URL de origem, data de download, `sha256` e bytes por arquivo) entra em
`docs/inventario/04-tipografia.md`.

Alternativa descartada: `@fontsource/*` como dependência. Violaria a Lei 7 (nenhuma necessidade além
de três arquivos) e trocaria cinco arquivos versionados e auditáveis por uma árvore de node_modules.

### D6 — Medição por seletor explícito, nó a nó · `S-CLAUDE`

O script de medição deste bloco recebe uma lista explícita de seletores e mede cada nó nomeado. Não
reusa a heurística de `scripts/inventario/extract-styles.mjs:68` (`section.querySelector(selector)`),
que pega o primeiro nó do seletor dentro da seção e alcança o eco duplicado pelo Divi — é `D-16`, que
continua aberto e some do caminho deste bloco por construção, não por correção.

Quando um seletor casar com mais de um nó na referência, o script falha alto em vez de escolher o
primeiro.

### D7 — João ratifica a lista de diferenças, não o par a par · `S-JOAO`

Mesma forma da decisão D2 do bloco `6.1.1-6.3.1`: Claude mede, classifica, corrige o não
intencional e apresenta a lista final; João ratifica o resumo. O `contact-sheet.html` da rodada nova
fica versionado para que a leitura completa continue possível.

### D8 — O resíduo do bloco de ícone não é corrigido · `S-CLAUDE`

Cada card de destaque perde `-26px` no bloco de ícone: a referência usa glifo `ETmodules` de `60px`
com `margin-bottom: 30px`, e o clone usa `lucide-react` de `48px`. Isso é consequência direta da
divergência intencional aprovada em 2026-08-25, não defeito. Fica declarado na matriz com o número
medido, e os outros `-70px` por card (padding e espaçamento) são corrigidos.

### D9 — Divergência entre duas medições do repositório bloqueia, não é resolvida em silêncio · `S-CLAUDE`

Exemplo concreto já visível: `05-layout.md` registra calha de `59.39px` (a `--spacing-gutter` que
`Row` usa), enquanto a rodada de 2026-08-29 mediu `30px` entre os cards de curso em 375. As duas
podem ser verdade em linhas diferentes do Divi, mas não podem ser assumidas iguais.

Quando a medição nova contradisser evidência versionada, a tarefa registra as duas leituras, a
consequência de seguir cada uma, e a decisão fica com João. Nenhum valor do inventário é sobrescrito
silenciosamente.

### D10 — Snapshot é regenerado, nunca editado; a guarda muda de projeto no mesmo bloco · `S-CLAUDE`

Fonte real e espaçamento corrigido mudam pixel, então os snapshots de `toHaveScreenshot` regeneram
de qualquer forma. `D-25` é resolvido junto — `regressao-visual.spec.ts` sai de `chromium` e passa a
rodar no projeto `producao` — porque mover o spec exige regerar snapshot sob o nome do projeto novo,
e fazer isso em bloco separado custaria uma segunda regeração.

Os snapshots antigos são apagados e recriados por execução do Playwright, não editados.

### D11 — Documento deste bloco passa por `pnpm format` antes do commit · `S-CLAUDE`

`D-18` continua aberto: `prettier-plugin-tailwindcss` reordena classe Tailwind dentro de bloco de
código em qualquer markdown, spec e plano incluídos, e `format:check` faz parte de `pnpm check`.
Enquanto o débito não for corrigido em tarefa de harness, todo documento deste bloco roda
`pnpm format` antes de ser commitado, para que o commit já contenha a forma que o gate exige.

## 4. Arquitetura da mudança

### 4.1 Fontes

```text
src/assets/fonts/montserrat-500.woff2   substituído pelo arquivo real do peso 500
src/assets/fonts/montserrat-700.woff2   substituído pelo arquivo real do peso 700
src/assets/fonts/open-sans-600.woff2    substituído pelo arquivo real do peso 600
src/assets/fonts/fonts.test.ts          novo — cinco sha256 distintos
docs/inventario/04-tipografia.md        proveniência dos cinco arquivos
```

`src/index.css` não muda **por causa da fonte**: as cinco declarações `@font-face` já apontam para os
cinco nomes e já declaram os pesos certos. O defeito está nos bytes, não na folha de estilo. (A
folha ainda pode ganhar token de espaçamento na tarefa 5 — ver 4.4.)

### 4.2 Preload e performance

`scripts/vite/preload-critical.mjs` tem hoje o alvo `montserrat-400` e um comentário explicando por
quê: com os três arquivos idênticos, o Vite dedupava por conteúdo e o nome sobrevivente herdava o
prefixo do primeiro `@font-face`. Com arquivos distintos esse dedupe desaparece e o `<h1
id="hero-heading">` — elemento do LCP, `font-bold` — passa a carregar `montserrat-700`. O alvo muda,
o comentário é reescrito e `scripts/vite/preload-critical.test.mjs` acompanha.

`pnpm qa:perf` roda de novo sobre o build, com relatório cru versionado e delta declarado contra a
medição de `6.2.2` (Performance 99, LCP 2112 ms, CLS 0). Três arquivos de fonte a mais entram na
conta de bytes; a medição diz quanto.

### 4.3 Medição de espaçamento

```text
scripts/qa/medir-espacamento.mjs   novo — mede referência e clone, nó a nó, nas 4 larguras
scripts/qa/lib/espacamento.mjs     lista de seletores e leitura das caixas
package.json                       script `qa:espacamento`
tsconfig.node.json                 include do script novo
docs/qa/paridade/<data>/espacamento.json + .md
```

O script mede, para cada nó declarado: `getBoundingClientRect` (altura, top, bottom),
`getComputedStyle` de `padding-*`, `margin-*`, `gap`, `font-size`, `line-height` e `font-weight`, nas
larguras 375, 768, 1440 e 1920, contra `https://lotusotec.cl/` e contra o build de produção local. A
saída é a evidência que autoriza cada correção da tarefa 5 — nenhum valor entra em código sem linha
correspondente nesse arquivo.

### 4.4 Correções de espaçamento

Alvos conhecidos hoje (medidos em 375 na review de 2026-08-29), a confirmar nas quatro larguras:

| seção         | arquivo                                    | estado atual                                        | alvo da referência                                           |
| ------------- | ------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------ |
| hero          | `src/components/sections/Hero.tsx`         | `mt-8` (32px) entre corpo/CTA, sem margem no kicker | margens verticais `45/40/50px` entre kicker, h1, corpo e CTA |
| institucional | `src/components/sections/QuienesSomos.tsx` | um `<p>` único                                      | vários `<p>` com ~19px entre eles (D4)                       |
| destaques     | `src/components/sections/Destaques.tsx`    | card sem padding, `mt-4` no título                  | `padding: 30px` no card, `padding-bottom: 10px` no título    |
| cursos        | `src/components/sections/Cursos.tsx`       | linha `py-6.75` (27px), `gap-gutter` (59.39px)      | padding da linha `30px`, gap conforme medição (D9)           |
| contacto      | `src/components/sections/Contacto.tsx`     | linha `px-6 py-6.75`, divisor `h-2.25`              | padding e espaçamento título/texto/formulário medidos        |
| rodapé        | `src/components/layout/Footer.tsx`         | container do copyright 48px                         | 58px                                                         |

Valor que se repetir vira token em `:root` de `src/index.css`, por `frontend.md`; valor de uso único
fica no componente. Nenhuma cor, texto ou estrutura de seção muda além do que D4 autoriza.

### 4.5 Guarda de regressão

```text
playwright.config.ts             `regressao-visual.spec.ts` entra no testMatch do projeto `producao`
e2e/regressao-visual.spec.ts     comentário atualizado: guarda o build, não o dev server
e2e/**-snapshots/                snapshots regenerados sob o nome do projeto novo
```

O projeto `chromium` usa `testIgnore: ['**/producao.spec.ts']`; com o spec de regressão movido para
`producao`, o `testIgnore` do `chromium` precisa cobri-lo também, ou o spec roda duas vezes em
condições diferentes.

### 4.6 Documentação

A rodada nova mora em `docs/qa/paridade/AAAA-MM-DD/`, com a data real da captura. Duas amarras
precisam acompanhar: `RUN_DIR` em `scripts/qa/lib/paridade.mjs:7` é a constante que nomeia a pasta, e
`scripts/qa/lib/paridade.test.mjs:40` afirma o valor literal `docs/qa/paridade/2026-08-29`. Mudar só
a constante deixa o teste vermelho; mudar só o teste faz a rodada gravar por cima da anterior.

```text
docs/qa/paridade/AAAA-MM-DD/        rodada nova: referencia/, clone/, contact-sheet.html, manifest, classificacao.md
scripts/qa/lib/paridade.mjs         RUN_DIR aponta para a pasta da rodada nova
scripts/qa/lib/paridade.test.mjs    a asserção literal da pasta acompanha
docs/inventario/README.md           matriz: "Altura vertical das seções" sai de `pendente decisão`;
                                    "Institucional" ganha a nota de D4; linha nova de peso de fonte (D-26)
docs/inventario/04-tipografia.md    proveniência das cinco faces
docs/qa/homologacao-2026-08-29.md   adendo retirando as ressalvas D-23, D-24, D-25 e D-26
docs/superpowers/backlog.md         D-23, D-24, D-25 e D-26 fechados; D-16 reafirmado como aberto
```

## 5. Tarefas e aceite

| #   | tarefa                              | aceite provado por                                                                                                                                |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Baixar as três faces reais          | `sha256sum src/assets/fonts/*.woff2` devolve cinco hashes distintos; proveniência escrita em `04-tipografia.md`                                   |
| 2   | Catraca de fonte                    | `fonts.test.ts` falha na árvore antes da tarefa 1 e passa depois (prova de mutação com o arquivo antigo restaurado)                               |
| 3   | Preload e performance               | alvo do preload é `montserrat-700`, `preload-critical.test.mjs` verde, `pnpm qa:perf` reexecutado com relatório versionado e delta declarado      |
| 4   | Medir espaçamento                   | `pnpm qa:espacamento` grava JSON e markdown com os nós declarados nas quatro larguras; seletor ambíguo faz o script falhar                        |
| 5   | Corrigir espaçamento das seis áreas | cada valor em código tem linha correspondente na medição da tarefa 4; testes de seção atualizados; nenhum texto alterado                          |
| 6   | Mover a guarda de regressão         | `regressao-visual.spec.ts` roda só no projeto `producao`; snapshots regenerados; execução prova que o `<link rel="preload">` está no HTML servido |
| 7   | Rodada de paridade nova             | `pnpm qa:referencia`, `pnpm qa:clone`, `pnpm qa:contact-sheet` numa pasta datada nova, com manifest e `sha256` por arquivo                        |
| 8   | Classificar e ratificar             | `classificacao.md` da rodada nova com o resíduo por seção; ratificação explícita de João registrada com data e hora (D7)                          |
| 9   | Matriz e homologação                | "Altura vertical das seções" deixa de ser `pendente decisão`; linha de peso de fonte criada; adendo de homologação escrito                        |
| 10  | Backlog                             | `D-23`, `D-24`, `D-25` e `D-26` marcados como fechados por este bloco, com data                                                                   |

## 6. Critério de aceite do bloco

1. Os cinco `.woff2` têm cinco `sha256` distintos e o teste que garante isso está na suíte.
2. O preload aponta para a face que o elemento do LCP realmente carrega, e a medição de performance
   pós-mudança está versionada.
3. Todo valor de espaçamento alterado em código tem linha correspondente no arquivo de medição da
   rodada, contra a referência ao vivo.
4. O resíduo de altura que sobrar está medido por seção e declarado na matriz; a linha "Altura
   vertical das seções" não é mais `pendente decisão`.
5. `regressao-visual.spec.ts` roda no projeto `producao` e não roda em `chromium`.
6. A matriz tem linha para o peso real das fontes (`D-26`).
7. `pnpm check` exit 0 e `pnpm e2e` exit 0, sob Node 24.19.0, com a saída real registrada.
8. Nenhuma dependência nova: `pnpm-lock.yaml` fora do diff, e `package.json` muda só no bloco
   `scripts`, para ganhar `qa:espacamento`.
9. Nenhum texto institucional alterado: o diff de `src/content/site.ts` muda estrutura, não palavras.

## 7. Riscos

- **A fonte real muda mais do que altura.** Glifo mais pesado pode alterar quebra de linha do `h1`
  do hero, que `05-layout.md` documenta como paridade medida (`--spacing-hero-inset: 103px`). Se a
  quebra de `LOTUS OTEC` mudar em algum viewport, isso é divergência nova e vai para D9, não é
  corrigido por ajuste de inset sem medição.
- **A medição nova pode contradizer o inventário da Sprint 1** (calha de `59.39px`). Tratado por D9.
- **O resíduo pode não fechar.** Se depois das correções sobrar delta sem causa medida, o aceite 4
  se cumpre declarando o resíduo, não escondendo — mas o bloco não fecha com "não classificável",
  que foi exatamente o que a review de 2026-08-29 reprovou.
- **Peso de bytes.** Três arquivos reais a mais podem piorar a nota de performance medida em
  `6.2.2`. A medição da tarefa 3 é o que decide se há algo a fazer; regressão medida vira débito
  declarado, não correção improvisada.

## 8. Handoff de execução

executor: claude
reviewer: codex
paths_autorizados:

- `src/assets/fonts/**`
- `src/index.css`
- `src/content/site.ts`
- `src/components/sections/Hero.tsx`
- `src/components/sections/QuienesSomos.tsx`
- `src/components/sections/Destaques.tsx`
- `src/components/sections/Cursos.tsx`
- `src/components/sections/Contacto.tsx`
- `src/components/layout/Footer.tsx`
- `src/**/*.test.ts`, `src/**/*.test.tsx`
- `scripts/qa/**`
- `scripts/vite/preload-critical.mjs`, `scripts/vite/preload-critical.test.mjs`
- `e2e/regressao-visual.spec.ts`, `e2e/**-snapshots/**`
- `playwright.config.ts`
- `package.json` (apenas o script `qa:espacamento`)
- `tsconfig.node.json`
- `docs/qa/**`
- `docs/inventario/README.md`, `docs/inventario/04-tipografia.md`
- `docs/superpowers/**`
