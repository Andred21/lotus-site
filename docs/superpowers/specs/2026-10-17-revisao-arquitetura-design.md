# Spec — `revisao-arquitetura-2026-09` · Revisão de arquitetura (bloco `B9`)

> Work item: `revisao-arquitetura-2026-09` · Branch: `refactor/revisao-arquitetura` · Base: `e0447ef`
> Context Packet: nenhum (§3 D0).

## 1. Objetivo

Aprofundar os módulos onde a revisão de arquitetura de 2026-10-11 achou atrito provado, sem mudar
um pixel nem o contrato público do site: um leitor só para os templates de `infra/`, a zona DNS
declarada uma vez, o honeypot fora da interface do Contact intake e um teste de contrato entre o
adapter do navegador e a função do contato.

O bloco foi autorizado por João em 2026-09-02 com dez candidatos de uma revisão sobre
`main@30a4c0b`. Essa lista ficou velha: depois dela vieram `B1` a `B8`, o WordPress foi apagado e o
Web3Forms saiu. João rodou `/improve-codebase-architecture` de novo em 2026-10-11, sobre
`refactor/revisao-arquitetura@e0447ef`, e o relatório novo substitui a lista antiga (D1). Cada
alegação do relatório foi conferida contra o código por três subagentes de verificação; o que
sobreviveu está em §4, e as correções que mudaram a decisão estão marcadas.

Sucesso: os quatro candidatos de §5 entregues, um commit cada; saldo líquido de linhas negativo;
nenhum snapshot visual alterado; `pnpm check`, `pnpm e2e` e a árvore espelhada verdes; e o
`conferir-zona` passando ao vivo sem flag (D13).

## 2. Escopo negativo

- **Nada visual.** Nenhum componente muda de classe, texto ou estrutura. Os snapshots de
  `e2e/regressao-visual.spec.ts-snapshots/` não são regravados.
- **Ferramental da referência congelado** (D3): `scripts/inventario/`, `scripts/qa/` e
  `scripts/wordpress/` não são tocados. Os candidatos 05, 08 e 09 do relatório ficam fora.
- **Não muda `infra/*.yaml` em valor nenhum.** Comentário pode mudar; registro, parâmetro e recurso
  não. Nenhum deploy de stack sai deste bloco.
- **`WORDPRESS` e `eDoCorte` ficam** (D7), por decisão da spec de `7.2.7` (D7).
- **Não muda o JSON entre navegador e função.** As chaves de `ContactMessage` continuam as mesmas;
  a função continua compatível com o site anterior e com o próximo (§11).
- **Não muda o comportamento do captcha** nem a política de reset do widget (candidato 07 fora, D2).
- **Os candidatos antigos que sobreviveram não entram** (D1): vão para `B11 · frontend-testes`.
- **Nenhuma dependência nova** (Lei 7).
- **Não escreve no Notion, Drive nem Figma** (Lei 6). O bloco não tem EAP no Notion.

## 3. Decisões

`S-JOAO` marca decisão de João nesta rodada de planejamento (perguntas Q1 a Q13 e as três escolhas
de escopo anteriores ao relatório). As recomendações foram de Claude; todas foram aceitas.

### D0 — Sem Context Packet · Claude

Nenhuma fonte externa: o contexto é o código, o relatório que João gerou e entregou nesta sessão
(`architecture-review-20261011-192700.html`, efêmero, fora do repositório) e a verificação dele.
§4 guarda a substância do relatório verificado, para que ela não se perca de novo, como aconteceu
com a lista de 2026-09-02 (o relatório HTML sumiu e a lista só sobreviveu em `68542eb`).

### D1 — A lista de 2026-09-02 foi substituída · `S-JOAO`

O relatório de 2026-10-11 é a base do bloco. O antigo candidato 5 (`rgbToHex`) está no 09 novo, e
a antiga candidata C no 08. Os antigos que continuam válidos e que o relatório novo não cobre — 1
(`data-node`), 4 (o que sobrou), 7 (`ContactForm` com união discriminada), 8 (viewports do `e2e/`),
9 (testes de string de classe) e 10 (`@utility` do CTA pílula) — saem do `B9` e viram o item
`B11 · frontend-testes` no backlog (Q1), levando as duas decisões que João já tomou sobre eles:

- antigo 1: `data-node` só nos cinco nós de `e2e/a11y-exceptions.ts` (três corpos de destaque,
  `.text-link` e a legenda do rodapé), com nomes no padrão de `NOS`; `NOS` e `espacamento.mjs`
  intocados; `Row` não ganha prop;
- antigo 9: apagar os asserts de `className` que só repetem o JSX e cobrir o pixel com
  `regressao-visual.spec.ts`, que ganha 768 e 1920.

### D2 — O que entra: 01 → 02 → 03 → 04, variante barata · `S-JOAO`

Um bloco, um commit por candidato, um PR (Q2). Fora, com destino:

| Candidato                        | Destino                                                                   |
| -------------------------------- | ------------------------------------------------------------------------- |
| 05 · ferramental da referência   | segue congelado (D3); D-71 e D-72 ganham a nota de que exigem descongelar |
| 06 · respostas dos resolvedores  | anotado no backlog; retorno baixo (§4.5)                                  |
| 07 · ciclo de vida do token      | débito novo, com a divergência do reset (§4.6)                            |
| 08 · página assentada por estado | nada; sem consumidor vivo sob o congelamento                              |
| 09 · veredito de paridade        | nada; o D-31 é reapontado (D4)                                            |

### D3 — Ferramental da referência congelado · `S-JOAO`

Desde `B7`, `launchReferencia` rejeita sempre e sete CLIs não rodam. O ferramental fica como
registro histórico: nem reviver contra o backup restaurado, nem apagar. Decidido antes do relatório
e mantido depois dele: a verificação mostrou que o "conhecimento espalhado" do candidato 05 está
quase todo em código morto.

### D4 — `D-31` reapontado · `S-JOAO`

O gatilho do `D-31` é este bloco (`backlog.md:431`). Trocar `rgbToHex` por `cssColor` em
`extract-styles.mjs` não muda nada observável enquanto o script não roda. O gatilho passa a ser "a
próxima regeração de `styles.json`", junto do `D-16` e do `D-72` (Q4). Só documentação, no
fechamento.

### D5 — `D-75` fora do bloco, com prioridade · `S-JOAO`

O ensaio de restauração está quebrado hoje: `verificar-restauracao.mjs` lê o vivo primeiro, o IP
responde `403`, `exigirVivo` reprova e o `set -e` de `ensaio-restauracao.sh` aborta antes da
checagem de PHP Fatal. É procedimento de desastre, não refatoração, e a fonte do texto de
referência é decisão própria (a §2 da evidência de `7.2.7` gravou título e `h1`, não o texto).
Fica fora, com o gatilho atual, e sobe de prioridade no backlog (Q5).

### D6 — `template.mjs` sobre `yaml.mjs` · `S-JOAO`

A semântica do CloudFormation — parâmetro, recurso, saída e resolução de `!Ref`/`!Sub` contra
`Default` — mora num módulo novo, `scripts/infra/lib/template.mjs`, construído sobre `lerYaml`.
`yaml.mjs` continua só leitor de YAML, com os dois exports e os testes de hoje (Q6).

### D7 — `WORDPRESS` e `eDoCorte` ficam · `S-JOAO`

A spec de `7.2.7` (D7, aprovada em 2026-10-11) manteve as duas: `respondeComoBorda` usa
`WORDPRESS`, e `conferirAliasesDoCorte` usa `eDoCorte`. O candidato 02 propunha apagar; não apaga
(Q7).

### D8 — O INVENTARIO vira nome e tipo, mais o MX literal · `S-JOAO`

O INVENTARIO sai. O template vira a fonte única dos registros. No lugar dele (Q8):

- uma lista de **nome e tipo** dos 19 registros esperados, sem valor — mantém a guarda contra
  leitura vazia (`zona.test.mjs:64-68`, `:322-324`) e reprova registro apagado sem querer;
- a constante literal do **MX do Google**, com as cinco prioridades — e-mail no Google Workspace é
  invariante da `ADR-SITE-006`, e o teste de `zona.test.mjs:182-193` continua precisando dela.

O que se perde: a catraca offline deixa de notar um `Default` trocado (`DominioDaDistribuicao`,
`TokenDkim*`). Quem passa a notar é o `conferir-zona`, que compara o template com a zona no ar
(D13).

### D9 — O modo de antes da delegação sai · `S-JOAO`

Sem flag, `conferir-zona` roda o modo pré-delegação (`conferir-zona.mjs:67`): espera
`ns*.stackdns.com` e resposta da StackDNS nos nomes inventados, e sai com `1`. Mesmo assim,
`runbook-aws.md:268` e `zona-dns-lotusotec.md:213` mandam rodar sem flag. A delegação foi em
2026-09-26 e não tem volta prevista (Q9). Sai:

- a flag `--pos-delegacao` — o modo de depois da delegação passa a ser o único;
- `NS_DA_STACKDNS`;
- o parâmetro `posDelegacao` e o ramo antigo de `wildcardAusente` e de `delegacaoEsperada`.

Fica `NOMES_INVENTADOS`: provar que o wildcard não existe continua valendo.

### D10 — Honeypot disparado é `failed`, checado antes do schema · `S-JOAO`

O Contact intake lê o campo-armadilha antes do schema; preenchido (depois de aparado), devolve
`{ status: 'failed' }` sem tocar a rede. A tela fica idêntica à de hoje: `feedback.error`, sem
campo marcado. O schema, `ContactFormInput` e `ContactFieldErrors` perdem `botcheck`. O nome do
campo vira constante em `src/lib/contact-fields.ts`, único módulo que a view e o intake podem ver
(`eslint.config.js:63-81`). O `<input>` continua na view, porque o intake lê `FormData` (Q10).

A `ADR-SITE-005` diz na linha 96 "o honeypot `botcheck` já existe no schema e continua", e o
corpo dela não é reescrito (`:140`). Entra a **Emenda E2**, que revoga essa linha e registra D10 e
D11. A Emenda E1 D5 ("a função nem recebe o campo `botcheck`", `:162-163`) passa a valer também no
código.

Rejeitado: sucesso silencioso. Se um autofill preencher o campo oculto, a mensagem de uma pessoa
real se perderia sem aviso, contra o princípio "falhar de forma visível" (`intake.ts:27-35`).

### D11 — POST forjado com `botcheck` leva `403` · `S-JOAO`

Hoje a função lê `botcheck` (`handler.ts:99`) e recusa com `400` antes do siteverify. Depois do
bloco ela ignora o campo: o POST forjado passa pelo schema, chega ao siteverify sem token válido e
leva `403`, com `desfecho` `captcha-recusado` no log em vez de `schema`. Custa uma chamada gratuita
à Cloudflare. O texto do `D-54` é atualizado, porque descreve a função tratando a ausência como
`''` e o sensor sugerido ali conta `desfecho` (Q11).

### D12 — Teste de contrato com o adapter e o handler reais · `S-JOAO`

Hoje nenhum teste passa o corpo do adapter ao handler. Entra um teste em `lambda/contato/`:
`createApiContactoSender` real, com um `fetch` falso que monta o `FunctionUrlEvent` a partir do
corpo e dos cabeçalhos que o adapter mandou, e entrega ao `createHandler` real (captcha `'ok'` e
e-mail simulados). Prova a ida (o `EmailSender` recebe a mensagem esperada) e a volta (o adapter lê
o `{ok}` e devolve `sent`). Junto, os dois leitores crus deixam de aceitar qualquer string: o `read`
do handler é tipado `keyof ContactMessage`, e o do intake pelos nomes de campo do formulário (Q12).

O teste fica em `lambda/` porque o projeto `app` não carrega `@types/node`, e `handler.ts` usa
`Buffer` (`:74`).

### D13 — `conferir-zona` ao vivo é aceite do 02 · `S-JOAO`

Teste offline não prova que o modo padrão voltou a passar. O aceite do 02 exige rodar
`pnpm infra:conferir-zona`, sem flag, contra a zona real, com saída `0`, e versionar o relatório que
ele grava em `docs/infra/conferencia-zona-<data>.md`. O comando só lê: consultas DNS e
`aws cloudformation`/`route53` de leitura, com a credencial local. Claude roda em `/executar-site`
(Q13).

### D14 — Claude executa e revisa · `S-JOAO`, 2026-10-17

A conta do Codex está sem cota. Claude executa e também faz a review formal de `/revisar-site`. O
desvio vai para `reviewer_exception` no estado, com motivo, data e autorização de João, e vira o
débito `D-77`, na classe de `D-73` e `D-76`. A review acontece, mas não vale como lente
independente.

## 4. Achados verificados

Placar de cada candidato: alegações confirmadas / parciais / erradas, contadas pelos verificadores
com prova `arquivo:linha`. Só as correções que mudam leitura ou decisão aparecem aqui.

### 4.1 Candidato 01 — um leitor de template (entra)

Placar 7 / 4 / 1. Confirmado: três leitores por coluna (`zona.mjs:228-410`,
`distribuicao.mjs:35-300`, `cabecalhos.mjs:92`, `:101`, `:174`) com três cópias de `semAspas` e a
mesma regex;
`yaml.mjs` já lê os cinco templates e o `ci.yml` (`yaml.test.mjs:126-135`), e a árvore que ele
devolve bate com a dos leitores por coluna em todo valor lido hoje; `distribuicao.mjs:9` importa
o leitor da zona; os leitores só têm chamadores em teste e nas próprias libs.

Corrigido:

- **"Hot spot, zona.mjs tocado 21×"** — o número confere, mas só 4 desses commits mexeram no leitor;
  uns 13 editaram o INVENTARIO. O churn é do 02. O 01 vale como pré-requisito do 02 e pela
  fragilidade provada: `60dd2c2` consertou `lerRegistros` somando o SAN do certificado ao último
  RecordSet.
- **"Os leitores discordam do `lerYaml` nas aspas do TXT"** — errado para os valores de hoje
  (`lotus-dns.yaml:135`, `:228`, `:237` saem iguais). A divergência existe só em escape YAML
  (`'it''s'`, `"a\"b"`), que nenhum valor lido usa. Risco latente, que o 01 elimina.
- **"O template para de se curvar ao leitor"** — não acontece: resolver `!Ref`/`!Sub` contra
  `Default` mantém a exigência de `Default`, e o comentário de `lotus-dns.yaml:28-31` dá dois
  motivos, não um.
- **"~570 linhas somem"** — o saldo líquido realista é de −350 a −450.
- Não citado: um quarto leitor ad hoc, por regex, do certificado em `zona.test.mjs:256-268`.

### 4.2 Candidato 02 — a zona declarada uma vez (entra)

Placar 9 / 6 / 1 exagerado. Confirmado: o INVENTARIO (`zona.mjs:41-148`) é cópia 1:1 dos 19
RecordSets do template depois de resolvidos, sem TTL e sem registro próprio; entradas posteriores
à medição (SES em `7177f4f`, `app` em `61d4999`, aliases em `515a13f`) foram copiadas do template,
não medidas; cada mudança chega como yaml + `zona.mjs` + teste + doc.

Corrigido ou acrescentado:

- **Defeito vivo** que o relatório não usou: o modo padrão do `conferir-zona` está errado e
  documentado como o comando a rodar (D9).
- **Dois papéis que o relatório omite:** guarda contra leitura vazia e detecção de `Default`
  trocado (D8).
- **`WORDPRESS`** — apagar revertia a spec de `7.2.7` D7 (D7).
- **"O nome da distribuição fica num lugar só"** — exagerado: `dhpoztt69jydz` segue em
  `lotus-dns.yaml:58`, `distribuicao.mjs:348` e em testes.
- **Não há documento** declarando a entrada dupla como "conferência de duas chaves". O runbook a
  prescreve como procedimento (`runbook-aws.md:403-404`, `:587-588`).
- Edições de zona já previstas (`D-46` DKIM do Google, `D-49` CAA) repetiriam o custo da edição
  dupla.

### 4.3 Candidato 03 — o honeypot sai da interface do intake (entra)

Placar 14 / 6 / 1. Confirmado: `botcheck` atravessa schema (`contact-schema.ts:17`, `:57`, `:74`,
`:89`, `:100`), intake (`intake.ts:56`), `ContactFieldErrors` (`:29`) e função (`handler.ts:83-85`,
`:99`); a mensagem do schema para o campo nunca aparece na tela (`ContactForm.test.tsx:262`); o
adapter nunca manda o campo (`api-contacto.ts:36`).

Corrigido:

- **"Depois: ContactForm só renderiza campos e captcha"** — errado: o `<input name="botcheck">`
  continua na view (`ContactForm.tsx:218-228`), porque o intake lê `FormData`.
- **"Ajusta a linha 96 da ADR"** — a ADR não se reescreve; o caminho é a Emenda E2 (D10).
- **"O código passa a bater com a E1 D5"** — hoje ele já não contradiz no fluxo real; o 03 remove
  um ramo dormente que só responde a POST forjado (D11).
- A "view filtra" é uma allowlist (`ContactForm.tsx:138-140`) que continua correta; o que perde a
  razão de existir é o comentário `:134-136`.

### 4.4 Candidato 04 — o formato do pedido (entra, variante barata)

Placar 8 / 4 / 2. Confirmado: `readContactFormData` (`intake.ts:45-61`) e `readInput`
(`handler.ts:86-102`) leem os mesmos campos por literal; `{ok}` tem três definições
(`api-contacto.ts:12`, `handler.ts:118`, `e2e/contato-falso.ts:59`); nenhum teste passa o corpo do
adapter ao handler.

Corrigido:

- **"Adicionar um campo vira uma edição"** — errado: `site.ts`, `ContactForm.tsx`,
  `contact-fields.ts`, as mensagens do schema e `ses.ts` continuam editados. Nenhum campo novo está
  previsto. Por isso a variante barata (D12) e não o módulo compartilhado de leitura e codificação.
- **"`tsconfig.lambda.json` só autoriza dois arquivos de `src/lib`"** — `include` não é allowlist:
  import transitivo puxa outros arquivos. Isso é o que permite o teste de D12 importar o adapter.
- A lista de campos aparece 13 vezes em 7 arquivos de produção, não ~10 em 6; só os 2 literais
  `read('…')` não têm guarda do compilador.

### 4.5 Candidato 06 — respostas dos resolvedores DNS (fora)

Placar 8 / 0 / 1. A diferença de classificação de `REFUSED`/`SERVFAIL` entre `conferir-zona`
(`:107-134`) e `medir-propagacao` (`:150-153`) é real, mas deliberada e documentada: cada uma é a
segura no seu contexto. **`30541b0` está citado ao contrário** — é o conserto; a quebra veio de
`537b8dd` e a causa é o `D-62`, que um módulo testado não pegaria (Vitest não typecheca). Os dois
CLIs rodam raramente depois da migração.

### 4.6 Candidato 07 — ciclo de vida do token do captcha (fora)

Placar 12 / 2 / 0. Toca de 10 a 12 arquivos e pede spec própria. Acrescentado pela verificação:
**a spec D6 do `B2`** (`2026-09-26-4.1.7-7.1.3-7.1.4-contato-ses-lambda-design.md:118-119`) manda
resetar o widget depois de qualquer resultado que não seja `sent`; **o código reseta sempre**,
inclusive depois de `sent` e de `invalid` antes da rede (`ContactForm.tsx:110`, `:118`). A
divergência vai para o débito, junto com o literal `cf-turnstile-response` repetido entre
`turnstile.ts`, `intake.ts`, o `e2e/` e o smoke, e o acoplamento de `crypto.subtle` com o captcha em
`App.tsx:23`.

### 4.7 Candidatos 05, 08 e 09 — ferramental da referência (fora, congelados)

- **05** — placar 13 / 7 / 0. A regra de resolução para o IP aparece em três lugares, mas aponta
  três alvos diferentes, e só um era a referência. A prova por `serverAddr` não distingue o `403`
  do StackCP. O `D-75` não depende de nova rodada: dispara na próxima restauração de desastre (D5).
- **08** — o "provável bug do Divi por não rolar" é exagero: a medição de 2026-09-02 leu as imagens
  carregadas e foi reproduzida byte a byte em 2026-10-11. Sob o congelamento só sobra o
  `capture-clone`, já coberto por `regressao-visual.spec.ts`.
- **09** — sem consumidor que rode; o aprofundamento cai no deletion test. O `D-31` é reapontado
  (D4).
- Achado lateral: o comentário de `scripts/qa/lib/paridade.mjs:6` ("regenerar cria pasta nova") é
  falso — `RUN_DIR` é fixo, e rodar `capture-clone` hoje sobrescreve o lado clone da rodada do
  `B8`. Vai para o backlog junto do congelamento.

## 5. Desenho

### 5.1 Candidato 01 — `template.mjs`

Interface do módulo novo, sobre `lerYaml`:

- ler o template e expor parâmetros (nome → `Default`), recursos e saídas;
- achar um recurso pelo nome lógico, conferindo o `Type`, e listar recursos de um tipo
  (os 19 `AWS::Route53::RecordSet`);
- resolver um valor com `!Ref`/`!Sub` contra os `Default`: parâmetro sem `Default` ou tag
  desconhecida lança erro com o caminho de onde veio.

O formato exato das funções fica para o plano. As regras de hoje continuam: tudo que os leitores
por coluna recusavam (propriedade fora do conjunto conhecido, recurso ausente) continua lançando
erro, agora como conjunto fechado conferido sobre a árvore.

Consumidores:

- `zona.mjs` — `lerParametros`, `resolver`, `lerRegistros`, `lerPoliticasDoRecurso` e
  `lerPoliticasDaZona` passam a usar `template.mjs`; `semAspas`, `recortar` e as regex de recuo
  saem.
- `distribuicao.mjs` — `lerDistribuicao`, `lerFuncao`, `nomesDoCertificado` e
  `lerPadraoDoParametro` idem; o import do leitor da zona (`:9`) sai. `executarFuncao` (runner de
  `node:vm`) fica como está.
- `cabecalhos.mjs` — fica só com `CABECALHOS`, `REMOVIDOS` e a lógica de domínio
  (`renderizarGrupo`, conjuntos fechados). `lerPoliticaDoTemplate` sai do arquivo: `vite.config.ts`
  e `e2e/smoke/8-cabecalhos.spec.ts` importam dele e não devem puxar o leitor para o grafo do build.
- Testes: os cerca de 28 testes de parser de `zona.test.mjs`, `distribuicao.test.mjs` e
  `cabecalhos.test.mjs` viram testes de `template.mjs` (fixtures pequenas) ou comparações sobre a
  árvore lida dos templates reais. O leitor ad hoc do certificado em `zona.test.mjs:256-268` sai.

As assinaturas públicas de conferência (`conferirDistribuicao(textoSite, textoDns)`,
`conferirObservabilidade`) não mudam.

### 5.2 Candidato 02 — o template como fonte da zona

- **`zona.mjs`** perde `INVENTARIO`, `NS_DA_STACKDNS` e o ramo pré-delegação (D9). Ganha a lista de
  nome e tipo dos 19 registros e a constante do MX (D8).
- **`zona.test.mjs`** confere o template contra essas duas constantes e mantém as regras que já
  tinha, agora sobre o template: sem wildcard, sem `NS`/`SOA`, alias só em apex e `www`, `app` sem
  `AAAA`, DMARC `p=none`, TTL 3600. Um template sem RecordSet, ou sem um dos 19 nomes, reprova.
- **`conferir-zona.mjs`** lê o template em runtime, via `template.mjs`, e itera os registros dele
  no lugar do INVENTARIO. A flag sai. Os rótulos mudam: a coluna "Inventário" vira "Template", e a
  coluna "StackDNS" ganha o nome do que ela é desde a delegação (o resolvedor DoH público). Os
  textos de nota pré-delegação (`:330-343`, `:369-379`) saem.
- **Documentos:** a linha de comando de `runbook-aws.md` (`:268` e os trechos `:228-229`,
  `:271-283`, `:403-404`, `:587-588`, `:697`) e de `zona-dns-lotusotec.md` (`:211-214`) passa a
  descrever o modo único e a edição única. As seções históricas da migração ficam como história.
  `lotus-dns.yaml` ganha só ajuste de comentário onde ele cita o INVENTARIO.

### 5.3 Candidato 03 — o honeypot dentro do intake

- **`src/lib/contact-fields.ts`** ganha a constante do nome do campo-armadilha.
- **`src/lib/contact-schema.ts`** perde `botcheck` de `ContactFormInput`, do schema, de
  `normalizeContactInput`, de `isFieldName` e de `MESSAGES`. O docstring (`:5-10`) deixa de
  prometer que o honeypot é recusado igual dos dois lados.
- **`src/integrations/contact/intake.ts`** lê a armadilha pela constante antes de montar a entrada
  do schema; preenchida depois de aparada, devolve `failed` sem chamar a porta.
- **`src/components/sections/ContactForm.tsx`** usa a constante no `name` do input. O comentário
  `:134-136` sai; a allowlist de `hasFieldErrors` fica.
- **`lambda/contato/handler.ts`** para de ler o campo; o comentário de `:81-85` sai.
- **Testes:** `intake.test.ts` passa a esperar `failed` com o honeypot preenchido e a porta não
  chamada; os casos de `botcheck` em `contact-schema.test.ts` saem; o teste
  "não fala em campos marcados quando só o honeypot falha" (`ContactForm.test.tsx:247-263`) sai,
  porque o tipo deixa de aceitar a chave; `handler.test.ts:185-194` passa a provar que um POST com
  `botcheck` e captcha recusado leva `403`. Os testes do input oculto na view
  (`ContactForm.test.tsx:92-101`, `:125`) ficam.
- **Documentos:** Emenda E2 na `ADR-SITE-005`; `CONTEXT.md` se citar o honeypot; texto do `D-54`.

### 5.4 Candidato 04 — teste de contrato

- **`lambda/contato/contrato.test.ts`** (novo, `@vitest-environment node`), como D12 descreve.
- **`handler.ts`** — `read` tipado `keyof ContactMessage`.
- **`intake.ts`** — `read` tipado pelos nomes de campo do formulário (`ContactFieldName`), mais os
  dois nomes que não são campo visível: o do honeypot (constante de 5.3) e o input oculto do
  Turnstile, que continua literal (o 07 está fora).
- `e2e/contato-falso.ts` não importa nada de `src/`: segue como oráculo independente.

Antes de escrever o teste, o plano prova que `tsc -b` aceita `lambda/` importando
`src/integrations/contact/api-contacto.ts` (e, por tipo, `intake.ts`) sob `tsconfig.lambda.json`,
que não tem DOM.

## 6. Sequência de execução

1. 01 — `template.mjs` com teste primeiro, depois os três consumidores.
2. 02 — depende do 01. Constantes de nome e tipo e do MX com teste primeiro, depois
   `conferir-zona.mjs`, depois documentos. Por último, o `conferir-zona` ao vivo (D13).
3. 03 — depois do 02 por ordem, sem dependência de código. Precisa vir antes do 04, para o 04 não
   tipar um `read` que ainda conhece `botcheck`.
4. 04 — prova de `tsc -b` primeiro, depois o teste de contrato e a tipagem.
5. Gates (§8).

## 7. Commits

Um por candidato, sem push (`/executar-site`):

1. `refactor(revisao-arquitetura): ler os templates de infra por um módulo só`
2. `refactor(revisao-arquitetura): declarar a zona DNS só no template`
3. `refactor(revisao-arquitetura): tirar o honeypot da interface do Contact intake`
4. `test(revisao-arquitetura): provar o contrato entre o adapter e a função do contato`

O relatório do `conferir-zona` ao vivo entra no commit 2. Débitos e backlog ficam para
`/fechar-site` (§10).

## 8. Prova de aceite

Critério específico, antes dos gates:

- **01:** nenhuma cópia de `semAspas` nem regex de recuo fixo em `scripts/infra/lib/` (grep);
  `template.mjs` com teste; `vite.config.ts` com o mesmo import de antes.
- **02:** `INVENTARIO` e `--pos-delegacao` sem ocorrência em `scripts/` e na linha de comando dos
  documentos (grep); teste que reprova template vazio e template sem um dos 19 nomes; e o
  `pnpm infra:conferir-zona` ao vivo, sem flag, saída `0`, com o relatório versionado (D13).
- **03:** `botcheck` sem ocorrência em `src/lib/contact-schema.ts` e em `lambda/` (grep); teste do
  intake com honeypot preenchido devolvendo `failed` sem chamar a porta.
- **04:** o teste de contrato passa, e falha se uma chave de `ContactMessage` for renomeada só de um
  lado (mutação manual, revertida, registrada no relatório da execução).
- **Zero pixel:** `pnpm e2e` verde sem regravar snapshot.

Gates, sob Node 24.19.0:

- `pnpm check` com saída `0`;
- `pnpm e2e` com saída `0`;
- a árvore espelhada: `git archive` de `HEAD` filtrado por `.espelho-exclusoes`, extraído num
  diretório novo do scratchpad, `pnpm install --frozen-lockfile --offline` e `pnpm check` com saída
  `0`. Obrigatório porque o bloco toca `scripts/infra/` e `lambda/`, e o `D-62` só aparece lá.

## 9. Rollback do próprio bloco

Tudo é repositório: `git revert` do commit. O único efeito fora do repositório vem depois do merge,
quando o CI republica a função do contato com os commits 3 e 4. A função é publicada antes do site
(`ci.yml:250-252`, antes de `:269`); as duas versões aceitam o JSON uma da outra, então a ordem não
importa. Nenhum stack de `infra/` é republicado com mudança.

## 10. Documentos, débitos e backlog

Durante a execução, junto do commit do candidato:

- `docs/adr/ADR-SITE-005.md` — Emenda E2 (commit 3);
- `docs/infra/runbook-aws.md`, `docs/infra/zona-dns-lotusotec.md` — modo único e edição única
  (commit 2);
- `docs/infra/conferencia-zona-<data>.md` — novo, gravado pelo `conferir-zona` (commit 2);
- `CONTEXT.md` — se o termo honeypot ou a descrição do intake mudar (commit 3).

No fechamento (`/fechar-site`), no backlog:

- **`B9`** com "Entregue"; **`AGORA`** atualizado.
- **`B11 · frontend-testes`** — novo, com os antigos 1, 4, 7, 8, 9 e 10 e as decisões de D1.
- **`D-31`** — gatilho reapontado (D4), junto do `D-16` e do `D-72`.
- **`D-75`** — sobe de prioridade (D5).
- **`D-71` e `D-72`** — nota de que só disparam se a referência for descongelada (D3), mais o
  `RUN_DIR` fixo de `paridade.mjs`.
- **`D-54`** — texto atualizado (D11).
- **Novo** — candidato 07: o token do captcha, a divergência do reset entre a spec D6 do `B2` e o
  código, o literal `cf-turnstile-response` e o acoplamento de `crypto.subtle` em `App.tsx`.
  **Gatilho:** próximo bloco que tocar o captcha ou o `ContactForm`.
- **Nota** — candidato 06 avaliado e não feito, com o motivo de §4.5.
- **`D-77`** — o bloco não tem segunda lente (D14). Entra no backlog com a transição para
  `ready_for_execution`, como o `D-76`.

## 11. Riscos

- **O leitor novo aceitar algo que o antigo recusava.** Mitigação: conjunto fechado (5.1) e os
  templates reais como fixture; os 19 RecordSets, os 7 `Default`, os 5 `AllowedPattern`, a CSP e o
  `FunctionCode` precisam sair iguais aos de hoje.
- **Catraca de zona mais fraca.** Perde a detecção offline de `Default` trocado (D8). Mitigação: o
  `conferir-zona` ao vivo (D13) e a regra do runbook de rodá-lo depois de toda edição da zona.
- **`D-62` na árvore espelhada.** `template.mjs` e o `conferir-zona` reescrito podem herdar tipo do
  DOM só na árvore inteira. Mitigação: gate da árvore espelhada (§8).
- **Typecheck de `lambda/` puxando `src/integrations/`.** Mitigação: prova de `tsc -b` antes do
  teste (5.4). Se reprovar, o teste de contrato volta para decisão de João antes de qualquer
  contorno.
- **Função e site fora de ordem no deploy.** Coberto em §9.
- **Review sem segunda lente** (D14). Registrado como `D-77`.

## 12. Handoff de execução

executor: claude
reviewer: claude
reviewer_exception: autorizado por João em 2026-10-17 — Codex sem cota; débito `D-77`
paths_autorizados:

- não se aplica (executor = claude)
