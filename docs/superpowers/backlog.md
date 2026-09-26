# Backlog — Lotus Site

> Fila operacional local. Não é fase e não autoriza execução: item só fica ativo por seleção
> explícita do João em `docs/superpowers/state.md`. Notion é o roadmap externo; este arquivo é o
> recorte ainda relevante. Item fechado sai da fila e o rastro fica em
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

## Como ler este arquivo

| Secção       | O que é                                                           |
| ------------ | ----------------------------------------------------------------- |
| `AGORA`      | o que está ativo e as decisões vigentes que moldam a fila         |
| `BLOCOS`     | a fila do MVP em ordem lógica de execução, com dependência real   |
| `DEPOIS`     | tema fora do MVP, sem ordem e sem estimativa                      |
| `PENDÊNCIAS` | o que depende do João ou de terceiro e não avança por conta nossa |
| `DÉBITOS`    | dívida declarada, aberta ou fechada, com gatilho                  |

Bloco desta fila não vira `active_work_item` por estar aqui. Continua valendo a Lei 3: seleção é
sempre explícita.

---

# AGORA

`B0 · espelho-8982f50` está ativo em `docs/superpowers/state.md`. As quatro evidências do `D-33`
foram colhidas em 2026-09-09/10 e estão em
[`docs/infra/evidencia-pipeline-2026-09-09.md`](../infra/evidencia-pipeline-2026-09-09.md).

## Decisões de 2026-09-09 (João)

Estas seis decisões reorganizaram a fila e estão registradas nos ADR citados:

1. **Toda a infraestrutura do site fica na AWS**, dentro do que a AWS aceita hospedar.
2. **O e-mail corporativo continua no Google Workspace.** A zona DNS migra; o MX não muda.
   (`ADR-SITE-006`)
3. **O envio do formulário passa a ser SES + Lambda Function URL.** Web3Forms sai.
   (`ADR-SITE-005`, que substitui a `ADR-SITE-002`)
4. **CI/CD continua no GitHub Actions**, com OIDC. Não migra para CodePipeline.
5. **A integração com a API do Lotus administrativo (`8.2.1`) está congelada.** Não planejar, não
   estimar, não abrir contexto. O subdomínio `sistema.lotusotec.cl` é registro de DNS e nada mais:
   criá-lo não abre esta task.
6. **Escrita no Notion autorizada** para registrar estas decisões. A Lei 6 exige autorização nova
   a cada vez; esta não vale para a próxima rodada.

## O que a AWS não aceita

`.cl` não pode ser registrado nem transferido para o Route 53 — a documentação do registrador da
AWS diz, na página do TLD, "You can no longer use Route 53 to register new .cl domains or transfer
.cl domains to Route 53" (lida em 2026-09-09). O **registro** do domínio fica onde está, na
BlueHosting. O que move para a AWS é a **zona**: o Route 53 hospeda zona de qualquer TLD. Detalhe
e consequências na `ADR-SITE-006`.

---

# BLOCOS

Ordem lógica de execução do MVP. `B0` a `B7` são o caminho crítico do go-live e a dependência entre
eles é real, não preferência. `B8` a `B10` não bloqueiam o go-live e entram quando o João quiser —
um por vez, porque o harness admite um `active_work_item` só.

## B0 · `espelho-8982f50` — promover o release e provar o pipeline

- **Escopo:** rodar `scripts/espelhar-corporativo.sh` e levar `8982f50` ao corporativo.
- **Por que é o primeiro:** `upstream/main` está em `08026af`, cujo trailer aponta `257c807`
  (medido em 2026-09-09). O `fix(7.1.2)` `4986caa` — que destrava o OIDC e a espera da invalidação
  — nunca atravessou. Todo bloco seguinte que publique depende deste caminho funcionar.
- **Nenhum arquivo do repositório muda.** É operação, classe `bounded`.
- **Fecha:** `D-33`.
- **Evidência exigida:** `procedencia` verde no corporativo; `deploy` publicando
  `releases/<sha>/`; `deploy` como `skipped` no run de push do pessoal; push direto sem trailer
  reprovando em `procedencia`.
- **Bloqueio externo:** nenhum.
- **Executado em 2026-09-09/10.** As quatro evidências estão colhidas em
  [`docs/infra/evidencia-pipeline-2026-09-09.md`](../infra/evidencia-pipeline-2026-09-09.md). O que
  atravessou foi `c6c6f9a`, a ponta de `origin/main` de agora, que já contém `8982f50`. O bloco sai
  desta fila em `/fechar-site`, depois da review.

## B1 · `7.2.1` — zona DNS em Route 53

- **Escopo:** recriar a zona de `lotusotec.cl` no Route 53, conferir, trocar os nameservers no
  registrador, emitir o certificado ACM em `us-east-1` e apontar o alias da distribuição.
- **Entrega junto:** `sistema.lotusotec.cl` como registro explícito. Hoje ele só existe por
  wildcard (`D-45`), e o limite de um subdomínio do painel atual deixa de valer no Route 53, que
  não tem esse limite.
- **Entrega junto:** ampliar o filtro do `AWS::Budgets::Budget` para o Route 53. Hoje ele filtra S3
  e CloudFront; assim que a zona existir, o teto de US$ 30 para de medir parte da conta.
- **Depende de:** `B0` não; depende de **acesso ao painel do registrador** (`D-44`).
- **Débitos que toca:** `D-44`, `D-45`, `D-46`, `D-47`, `D-49`, `D-50`, `D-51`, `D-52`.
- **Evidência exigida:** a zona nova respondendo nos nameservers da AWS **antes** da troca
  (consulta direta aos nameservers da AWS via `pnpm infra:conferir-zona`); cada registro do
  inventário conferido antes e depois; MX do Google intacto e recebimento testado com mensagem
  real; certificado em `ISSUED`; `curl -sI` do apex e do `www` batendo na distribuição.
- **Bloqueio externo:** nenhum desde 2026-09-20. O acesso ao StackCP voltou (`D-44`) e o export
  BIND deixou de ser necessário (`D-45`).
- **Inventário medido da zona:** `docs/infra/zona-dns-lotusotec.md`.
- **Entregue em 2026-09-20 (primeira rodada):** zona criada no Route 53 pelo stack `lotus-dns`,
  conferida contra a StackDNS registro a registro, catraca offline dentro do `pnpm check`, e filtro
  do Budget ampliado para Route 53. **Não** entregue: delegação, certificado, HTTPS, alias.
- **Entregue em 2026-09-26 (segunda rodada):** inventário fechado a partir do painel do StackCP, que
  revelou `pop3` e o wildcard duplo; delegação trocada e convergida; saída de e-mail provada com
  mensagem real e `SPF: PASS`; certificado ACM `ISSUED` para `lotusotec.cl` e `www.lotusotec.cl`,
  válido até 2027-04-11. **Não** entregue: HTTPS servido e alias da distribuição — são `B5`, e é o
  que resta de `D-47`. A entrada de e-mail em `contacto@` segue pendente de confirmação humana
  (PENDÊNCIAS).

## B2 · `4.1.7+7.1.3+7.1.4` — contato por SES + Lambda

- **Escopo:** `ADR-SITE-005`; Lambda com `AuthType: AWS_IAM` publicada como segunda origin do
  CloudFront em `/api/contacto`, com OAC assinando SigV4; SES com identidade de domínio, DKIM e
  MAIL FROM em subdomínio; adapter novo no lugar de `src/integrations/contact/web3forms.ts`.
- **Por que depende de `B1`:** DKIM e MAIL FROM são registros na zona. Sem a zona na AWS não há
  onde publicá-los.
- **Por que same-origin e não CORS:** com `/api/contacto` na mesma origem, a CSP de `B3` fecha em
  `connect-src 'self'` e a URL da função não é chamável direto.
- **Superfície de mudança medida:** 13 arquivos citam `web3forms` — o adapter, os testes unitários,
  `e2e/contacto.spec.ts`, `e2e/a11y.spec.ts`, `e2e/teclado.spec.ts`, `.env.example` e
  `src/vite-env.d.ts`. A porta `ContactSender` de `src/integrations/contact/intake.ts` **não muda**:
  é troca de adapter, o que a `ADR-SITE-003` já pagou.
- **Entrega junto:** ampliar o filtro do Budget para SES e Lambda.
- **Fecha:** `D-17`, por substituição — deixa de existir conta Web3Forms a criar.
- **Evidência exigida:** mensagem real chegando na caixa do Google Workspace; `/api/contacto`
  respondendo pela distribuição e a URL da função recusando chamada direta; nenhum segredo no
  bundle (`7.1.3` fecha por construção: a credencial é a role da função).
- **Bloqueio externo:** production access do SES. Conta nova nasce em sandbox — 200 mensagens/dia e
  só destinatário verificado —, e sair disso é ticket de suporte com espera. **Pedir no início de
  `B1`, não aqui.**

## B3 · `7.2.2` — headers e hardening HTTP

- **Escopo:** `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy` e `frame-ancestors` na `ResponseHeadersPolicy` de
  `infra/lotus-site.yaml`, que hoje declara só o `X-Robots-Tag`.
- **Depende de `B2`:** a CSP precisa saber quem o formulário chama.
- **Depende de `B1`:** HSTS só depois do domínio próprio servindo HTTPS estável — HSTS num domínio
  que ainda vai mudar é armadilha, não hardening.
- **Evidência exigida:** `curl -sI` mostrando cada cabeçalho; `pnpm e2e` verde com a CSP ligada,
  provando que ela não quebra fonte self-hosted, imagem nem o envio do formulário.

## B4 · `7.2.3+7.2.4` — backup do WordPress e smoke test

- **Escopo:** backup restaurável do WordPress e plano de rollback do corte; smoke test completo
  usando o artefato exato que vai ao ar.
- **Depende de:** `B2`, `B3`.
- **Evidência exigida:** restauração exercitada, não descrita; checklist de produção rodado contra
  o release que será promovido.

## B5 · `7.2.5` — cutover de `lotusotec.cl`

- **Escopo:** apex e `www` apontando para a distribuição; remoção do `X-Robots-Tag`; decisão de
  `D-39` (`PriceClass_100` não tem borda na América do Sul, e o visitante é chileno).
- **Depende de:** `B4`.
- **Fecha:** `D-22` — Rich Results Test e depuradores sociais passam a ter URL pública.
- **Evidência exigida:** `lotusotec.cl` entregando o clone por HTTPS; nenhum recurso essencial
  quebrado; rollback do `ADR-SITE-004` pronto para uso.

## B6 · `7.2.6` — observabilidade mínima

- **Escopo:** access log do CloudFront; alarme CloudWatch de taxa 5xx; health check do Route 53 com
  SNS; notificação de falha do workflow do Actions.
- **Depende de:** `B5` — antes do corte não há tráfego que valha medir.
- **Fecha:** `D-40`. **Toca:** `D-37` (rollback continua procedimento, sem botão).
- **Evidência exigida:** falha provocada de propósito chegando ao destinatário do alarme.

## B7 · `7.2.7` — desativar o WordPress

- **Escopo:** parar de servir produção pelo WordPress, preservando conteúdo e backup final.
- **Decidir sobre os quatro nomes do StackMail** — `pop3`, `imap`, `smtp` e `autodiscover` apontam
  para a StackMail. Foram copiados para o Route 53 por fidelidade, porque a regra do bloco da
  delegação era não mudar resposta nenhuma. A StackMail ainda envia — a mensagem de saída da prova
  de 2026-09-26 saiu dela, ver `D-50` —, e quem mais usa esses nomes só aparece desligando-os. Por
  isso a decisão anda junto com o desligamento do WordPress.
- **Depende de:** `B6` mais aceite explícito do João, depois de estabilização.

## B8 · `recaptura-baseline` — `D-30` e a conferência humana de paridade

- **Escopo:** corrigir `scripts/inventario/capture-baseline.mjs`, recapturar os cinco PNG de
  `docs/inventario/baseline/` e reamostrar a paleta inteira.
- **Por que existe:** os cinco PNG reportam o cabeçalho na cor errada, e a conferência humana de
  paridade — pendente desde a Sprint 2 e nunca feita — usa exatamente esse material.
- **Não bloqueia o go-live.** Bloqueia a conferência humana.

## B9 · `revisao-arquitetura-2026-09`

Autorizado por João em 2026-09-02, nunca selecionado. Dez candidatos de aprofundamento da revisão de
arquitetura (`/improve-codebase-architecture`, base `main@30a4c0b`), nenhum contradiz
`ADR-SITE-001/002/003`. Um commit por candidato; ordem sugerida 1, 2+3, 4, 5, depois os demais. O
detalhe dos candidatos está no histórico da rodada — o relatório HTML era efêmero e não sobreviveu.

Nota de 2026-09-09: o candidato 5 (defeito de `rgbToHex` descartando alpha) continua válido e é o
mesmo de `D-31`. A `ADR-SITE-002` passou a `superseded`, o que não invalida nenhum candidato.

## B10 · `harness-debitos`

- **Escopo:** `D-15` (rule de ícones órfã), `D-18` (Prettier reescreve plano e spec aprovados),
  `D-19` (transição de estado viajando junto de commit de código), `D-27` e `D-32` (segunda lente
  ausente). `D-16` e `D-31` entram se `scripts/inventario/` estiver nos `paths_autorizados`.
- **Não bloqueia o go-live.**

---

# DEPOIS

Tema, sem replicar EAP e sem ordem.

- **`8.2.1` · Integração com a API do Lotus administrativo — CONGELADO** por decisão de João em
  2026-09-09. Não planejar, não estimar, não abrir contexto. `sistema.lotusotec.cl` é registro de
  DNS entregue em `B1` e não abre esta task.
- **Evolução pós-clone** — `8.1.1`, `8.1.2`, `8.2.2`, `8.2.3`, `8.2.4`, `8.2.5` (Sprint 7).
- **Workflow IA** — `9.1.1`–`9.1.3` (Sprint 8), ver `D-03`.

---

# PENDÊNCIAS

O que não avança por conta nossa.

1. ~~**Acesso ao painel de DNS.**~~ Recuperado; confirmado por João em 2026-09-20. Ver `D-44`,
   fechado.
2. ~~**Export BIND da zona.**~~ Deixou de ser necessário: os prints do painel do StackCP, de
   2026-09-20, fecharam o inventário com a mesma autoridade. Ver `D-45`, fechado.
3. **Production access do SES.** Prazo externo. Pedir no início de `B1` para não travar `B2`.
4. **Conferência humana de paridade** contra os cinco PNG de `docs/inventario/baseline/`, herdada
   da Sprint 2 e nunca feita. Nenhum gate a substitui — e hoje está travada por `D-30`.
5. **Autorização de escrita no Notion.** Concedida em 2026-09-09 para registrar as decisões
   daquele bloco. **Não vale para esta rodada**: a EAP `7.2.1` não foi marcada no Notion, e o
   aceite parcial está declarado em `D-47`.
6. **Confirmar a entrada de e-mail em `contacto@lotusotec.cl`.** Uma mensagem de fora chegando e a
   resposta voltando. João confirma com o dono da caixa; o resultado entra em
   `docs/infra/delegacao-2026-09-26.md`, secção "Entrada", em commit próprio. Contexto em `D-50`.
7. **Decidir a renovação do certificado do WordPress** antes de 2026-10-11. Ver `D-51`.

---

# DÉBITOS

Dívida declarada. Aberto tem gatilho; fechado fica para quem for reabrir a discussão.

## Abertos

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
- **D-17 · envio real do formulário não provado** — não existe conta nem access key do Web3Forms
  nesta rodada (decisão de João em 2026-08-27, D6 da spec do bloco `4.1.1-4.1.10`). O adapter
  `src/integrations/contact/web3forms.ts` está provado contra a API documentada — `fetch` duplicado
  no teste unitário e `page.route` interceptando `api.web3forms.com` no E2E —, mas nenhuma mensagem
  chegou a uma caixa de entrada real, e o aceite da `4.1.7` fecha como **parcial declarado**.
  **Reafirmado em 2026-08-29** (D5 da spec do bloco `6.1.1-6.3.1`): a homologação `6.3.1` também
  fecha com o formulário como parcial declarado.
  **Gatilho:** quando João criar a conta, antes de `7.1.4` e do go-live.
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
- **D-32 · o incremento final do bloco `paridade-header-cursos` não teve segunda lente** —
  os cinco primeiros commits (`f19ee29..d619f0d`, onde está todo o código) tiveram review
  independente real do Codex, que produziu `R-1` (rebaixado a suggestion após verificação no
  código) e `R-2` (blocking, corrigido em `b9ac09a`). Os dois commits seguintes — `b9ac09a`, uma
  linha em `docs/inventario/04-tipografia.md`, e `68542eb`, só `docs/superpowers/backlog.md` — não
  puderam ser revisados: o Codex CLI encerra antes de iniciar, em 0.147.0 e 0.146.0, com
  `Error: failed to initialize in-process app-server client: Read-only file system (os error 30)`.
  Quem revisou esses dois commits escreveu ambos, então não valem como lente independente; nenhum
  toca código de produção. Desvio declarado em `reviewer_exception`, autorizado por João em
  2026-09-03. Mesma classe de `D-27`.
  **Gatilho:** Codex CLI funcional para uma segunda passada sobre `d619f0d..68542eb`, ou decisão de
  João de dispensar a passada por serem commits só de documentação.
- **D-34 · o campo `ADR ref` das doze EAP das Sprints 6 e 7 aponta `ADR-SITE-003`, que é outro
  assunto** — `docs/adr/ADR-SITE-003.md` é "O intake do contato é um módulo, não quatro". A decisão
  de hospedagem é a `ADR-SITE-004`. A Descrição e o Critério de `7.1.1` também estão stale: falam de
  Vercel, Next.js e Server Actions, e o repositório é Vite SPA desde `1.2.1` (sexta instância de
  `D-01`). João autorizou a correção no Notion em 2026-09-03; a Lei 6 exige reconfirmação no momento
  de executá-la.
  **Gatilho:** `ADR-SITE-004` commitado (feito) mais a reconfirmação de João.
- **D-35 · `7.1.5` não separa preview/staging de produção** — o aceite pede a separação e a
  arquitetura aprovada tem um bucket e uma distribuição (D3 da spec). O preview real do site é o CI
  de PR, que roda `pnpm check` e `pnpm e2e` desde `1.3.7`. Divergência declarada, não esquecida.
  **Gatilho:** `7.2.1`, quando o domínio criar a distinção de verdade.
- **D-36 · o `package.json` do espelho mantém os scripts `inventario:*` e `qa:*` apontando para
  arquivos que não atravessam** — `scripts/inventario/` e `scripts/qa/` estão em
  `.espelho-exclusoes` (emenda E1), e o manifesto precisa atravessar inteiro. Nenhum desses scripts
  é chamado por `check`, `e2e` ou pelo CI, então eles falham só se alguém os invocar à mão no
  corporativo. Separar os scripts exigiria um segundo `package.json`, que custa mais que o defeito.
  **Gatilho:** alguém precisar rodar inventário ou QA a partir do corporativo.
- **D-37 · o rollback é procedimento, não botão** — `ADR-SITE-004` traz o comando exato e ele foi
  exercitado uma vez na execução do bloco. Não há automação, não há teste que o exercite e não há
  alarme que o dispare.
  **Gatilho:** segundo incidente de publicação errada, ou `7.2.6` (observabilidade).
- **D-38 · a trust policy da role de deploy fixa `refs/heads/main`** — `sub` com `StringEquals` em
  `repo:Gatika-CL/lotus-site:ref:refs/heads/main`. Publicar a partir de tag ou de outra branch exige
  editar `infra/lotus-site.yaml` e reimplantar o stack. É a restrição desejada, registrada para que
  a próxima pessoa não a confunda com defeito.
  **Gatilho:** necessidade de publicar a partir de tag.
- **D-39 · `PriceClass_100` não inclui borda na América do Sul** — a distribuição usa a classe mais
  barata, que cobre Estados Unidos, Canadá, Europa e Israel. O visitante chileno é servido por uma
  borda do hemisfério norte, com latência maior. Aceitável enquanto o endereço é de homologação sem
  tráfego; a decisão precisa ser reconsiderada, com medição, antes de o domínio do cliente apontar
  para lá.
  **Gatilho:** `7.2.5` (cutover), ou primeira medição de latência real a partir do Chile.
- **D-40 · a distribuição não grava access log** — CloudTrail registra quem mudou o quê e o run do
  GitHub Actions registra o deploy, mas não existe registro de quem acessou o site. Ligar o log hoje
  criaria volume de objetos com custo e nenhum consumidor: não há dashboard, alerta nem consulta que
  os leia.
  **Gatilho:** `7.2.6` (observabilidade), junto com quem vai lê-los.
- **D-41 · o `dist/` do repositório de desenvolvimento não é byte a byte o `dist/` do espelho** —
  Tailwind v4 varre a raiz do projeto sozinho, sem lista de `@source`, então prosa em `docs/` gera
  utilitário. Medido em 2026-09-04, comparando o build deste repositório com o build da árvore
  filtrada do mesmo commit: 135 seletores contra 120. Os quinze a mais são `.table`, `.inline`,
  `.visible`, `.sticky`, `.border`, `.underline`, `.outline`, `.isolate`, `.transition`,
  `.text-balance`, `.mt-4`, `.mt-8`, `.w-4`, `.bg-header` e `.h-header-desktop` — palavras que
  aparecem em texto de documentação, não em componente. O CSS do espelho é subconjunto estrito do
  daqui, então o que vai ao ar é o correto e mais enxuto; o defeito é o excesso local. Consequência
  operacional: os nomes com hash divergem (`index-BzSLLf5o.css` aqui, `index-BJogPgYX.css` lá), e a
  prova "conjunto de arquivos publicado idêntico ao `dist/` do mesmo commit" precisa construir a
  partir da árvore filtrada, não deste repositório, ou reprova por acerto. Corrigir de verdade pede
  `@source` explícito em `src/index.css`, que está fora dos paths deste bloco.
  **Gatilho:** bloco que puder tocar `src/index.css`, ou a primeira vez que o conjunto publicado
  precisar bater com um build local.
- **D-42 · o job `procedencia` confere o trailer, não a árvore** — `Source-Commit` é validado por
  `gh api repos/$ESPELHO_FONTE/compare/main...$trailer`, que prova só que o SHA está no histórico de
  `main` na origem; nada compara `HEAD^{tree}` do espelho com a árvore daquele SHA filtrada por
  `.espelho-exclusoes`. Um push direto em `Gatika-CL:main` com conteúdo arbitrário e trailer válido
  passaria. O impacto real é limitado: quem tem escrita no corporativo já publica pelo outro ramo do
  mesmo job (`commit entrou por Pull Request mesclado`), então o trailer não é a fronteira de
  confiança — e a spec pede exatamente o que foi implementado. Fechar de verdade exige o corporativo
  ler o repositório pessoal (privado), ou seja, um token cruzado que hoje não existe.
  **Gatilho:** o repositório pessoal virar público, ou surgir credencial de leitura cruzada.
  Levantado na review do bloco `7.1.1+7.1.2+7.1.5` (achado R-1 do Codex, rebaixado a `suggestion`
  depois de verificado).
- **D-43 · a limpeza da raiz ainda expõe o cliente que carregou o index antigo antes da
  invalidação** — o job `deploy` e o rollback do `ADR-SITE-004` esperam `wait
invalidation-completed` antes de apagar da raiz o que saiu do build, então nenhuma borda serve
  index que aponte asset removido. Fica de fora o cliente que já tinha o index anterior na mão
  quando a invalidação terminou e só pede os assets dele depois: recebe 404. Fechar de verdade pede
  retenção — manter na raiz, por algumas horas, o asset que saiu, e apagar num passo separado — mas
  isso quebra a prova de aceite de `7.1.2`, que exige a raiz idêntica ao `dist/` do commit. As duas
  coisas só coexistem com uma regra de ciclo de vida no bucket, que é mudança de
  `infra/lotus-site.yaml` com desenho próprio.
  **Gatilho:** primeiro 404 de asset observado em produção, ou o bloco que puder redesenhar a
  retenção da raiz. Levantado na review do bloco `7.1.1+7.1.2+7.1.5`.
- **D-46 · o domínio não publica DMARC nem DKIM** — medido em 2026-09-09:
  `_dmarc.lotusotec.cl` e `google._domainkey.lotusotec.cl` não têm registro TXT; o `A` que
  aparece nos dois é o wildcard de `D-45`, não configuração. O que existe é só o SPF do apex,
  `v=spf1 include:_spf.google.com include:spf.stackmail.com -all`. O e-mail corporativo sai hoje
  sem assinatura e sem política de alinhamento. Não é regressão causada por nós — já era assim —,
  mas `B2` acrescenta um remetente novo (SES) ao mesmo domínio, e sem DMARC não há como observar o
  efeito disso na entregabilidade. O `include:spf.stackmail.com` também precisa de decisão: o MX é
  Google, e esse include pode ser resíduo do provedor antigo ou caminho de envio ainda em uso.
  O `include:spf.stackmail.com` atravessou a troca de nameservers intacto, por fidelidade e não por
  decisão de mantê-lo: mexer nele durante a delegação misturaria duas mudanças numa janela em que
  metade do mundo lê cada lado. E ele não é inerte: a mensagem de saída da prova de 2026-09-26
  passou com `SPF: PASS` pelo IP `185.151.28.66`, que está em `ip4:185.151.28.0/24` de
  `spf.stackmail.com` e fora de `_spf.google.com` (medido em 2026-09-26). O include é funcional —
  uma caixa da StackMail, criada por João para a prova, envia com `SPF: PASS` por ele —; se alguém
  da empresa usa esse caminho não foi medido, e isso pesa na decisão de `B2`.
  **Gatilho:** `B2`.

- **D-47 · `7.2.1` fechou parcial: sem HTTPS servido** — o critério de
  aceite da EAP no Notion pede domínio resolvendo e HTTPS válido. O bloco de 2026-09-20 entregou
  só a zona: criada no Route 53, conferida registro a registro contra a StackDNS e travada por
  catraca, mas **não delegada**. Sem delegação não há validação DNS-01, sem ela não há
  certificado, e sem certificado não há HTTPS. A EAP **não** foi marcada como concluída, e não
  havia autorização de escrita no Notion nesta rodada de qualquer forma.
  **Encolhido em 2026-09-26.** Delegação trocada, saída de e-mail provada e certificado `ISSUED`. O
  que resta é uma linha: **o HTTPS não é servido**. Nada apresenta o certificado a um navegador
  enquanto a distribuição não tiver `Aliases` e `ViewerCertificate`, e o ARN precisa atravessar de
  `us-east-1` para `sa-east-1` como parâmetro, porque CloudFormation não importa valor entre regiões.
  **Prazo:** `B5` precisa ligar o certificado à distribuição antes de 2027-04-11. Até lá ele não
  renova sozinho (`RenewalEligibility: INELIGIBLE`, porque não está em uso); se o prazo passar, o
  certificado expira e é preciso emitir outro. A EAP continua **não** marcada no Notion.
  **Gatilho:** `B5`.
- **D-49 · a zona não publica `CAA`** — sem `CAA`, qualquer autoridade certificadora do mundo pode
  emitir certificado para `lotusotec.cl`. A `CAA` precisa listar **toda** CA que emite para algum
  nome da zona: hoje são duas, `amazon.com` para o ACM e `letsencrypt.org` para o wildcard que a
  20i mantém no WordPress (`D-51`). Uma `CAA` só com `amazon.com` bloquearia a renovação do
  WordPress. Uma `CAA` errada bloqueia também a renovação do ACM, que depois que `B5` o puser em
  uso é automática e silenciosa, e com certificado de 198 dias acontece duas vezes por ano — a
  falha apareceria como site fora do ar meses depois, sem ninguém ter tocado em nada. Merece bloco
  com prova própria: publicar, medir, e só então confiar. `issuewild ";"` só depois de `B7`, quando
  o wildcard deixar de existir.
  **Gatilho:** depois de `D-51` decidido; a forma final, em `B7`.
- **D-50 · caixa criada na StackMail envia mas nunca recebe** — o `MX` de `lotusotec.cl` aponta
  para o Google Workspace; a StackMail só aparece no SPF. Uma caixa criada no StackCP — caso de
  `jvandreoli@lotusotec.cl`, em 2026-09-26 — manda mensagem com `SPF: PASS`, mas o que chega de fora
  para ela volta com `550 5.1.1`, porque o Google não a conhece. Já era assim antes da delegação: a
  StackDNS servia o mesmo `MX`. Não é regressão de `B1`. O efeito é alguém criar caixa no painel e
  achar que tem e-mail. O mesmo vale para `ana@lotusotec.cl`, dado de teste em cinco arquivos de
  `src/`: a sonda `RCPT` de 2026-09-26 respondeu `550 5.1.1`. Nenhum código de produção envia para
  ele, mas o endereço parece real e não é.
  **Gatilho:** `B7`, junto da decisão sobre os nomes do StackMail; o dado de teste, no próximo bloco
  que tocar esses testes.

- **D-51 · a delegação corta a renovação do certificado do WordPress** — o WordPress serve em
  `lotusotec.cl`, `www` e `sistema` um certificado Let's Encrypt **wildcard** (`*.lotusotec.cl`,
  emissor `Let's Encrypt YR1`), válido até **2026-11-10T20:37:55Z** (medido em 2026-09-26 com
  `openssl s_client`). Wildcard só se emite por validação DNS, e a 20i, que opera o StackCP, só
  emite o SSL grátis com os nameservers dela como autoritativos: o desafio é um TXT que ela grava na
  zona que controla, sem alternativa por HTTP nem por registro externo (docs.20i.com, "Can I use the
  free SSL if my site doesn't use the 20i nameservers?"). Desde 2026-09-26 quem responde por
  `lotusotec.cl` é o Route 53, então a renovação — que clientes ACME costumam fazer 30 dias antes do
  vencimento, por volta de 2026-10-11 — não tem onde publicar o desafio. Se nada mudar, **o HTTPS do
  site em produção expira em 2026-11-10**. A cópia fiel da zona não tinha como ver isso:
  `_acme-challenge` é registro efêmero, e não existe em nenhum dos dois lados fora da hora da
  emissão. Saídas, a decidir por João: (1) confirmar com a BlueHosting/20i o que acontece na
  renovação; (2) o certificado pago da 20i ("Simple SSL"), que ela oferece para domínio fora dos
  nameservers dela; (3) devolver a delegação à StackDNS antes da janela e refazer a troca junto com
  `B5` — a zona da StackDNS continua de pé, e nada serve o certificado do ACM até lá; (4) antecipar
  a parte TLS de `B5`, improvável a tempo porque `B5` depende de `B4`, `B3` e `B2`. `sistema` é
  servido pelo mesmo certificado, e o destino dele em `B5` precisa levar isto em conta.
  Verificação:

  ```bash
  echo | openssl s_client -connect lotusotec.cl:443 -servername lotusotec.cl 2>/dev/null \
    | openssl x509 -noout -issuer -dates
  ```

  **Gatilho:** agora. Decisão antes de 2026-10-11; prazo duro 2026-11-10.

- **D-52 · `delete-stack` do `lotus-dns` esvaziaria a zona viva** — `Zona` tem
  `DeletionPolicy: Retain`, mas `Registros` não: um `delete-stack` apaga MX, SPF e todo o resto e
  deixa a zona retida vazia, com o e-mail da empresa fora do ar. E o stack não tem termination
  protection (medido em 2026-09-26: `EnableTerminationProtection: false`). Duas correções: João liga
  a proteção, que é escrita na conta e não depende de deploy,

  ```bash
  AWS_PROFILE=lotus aws cloudformation update-termination-protection \
    --enable-termination-protection --region us-east-1 --stack-name lotus-dns
  ```

  e `Registros` ganha `DeletionPolicy`/`UpdateReplacePolicy: Retain`, com asserção na catraca, no
  próximo bloco que fizer deploy do `lotus-dns`.
  **Gatilho:** a proteção, agora, por João; a política, antes do próximo deploy do `lotus-dns`.

- **D-53 · o bloco `7.2.1` (delegação e certificado) não teve segunda lente** — Claude executou
  `b64bb94..cb06414` e também fez a review formal de `/revisar-site`: a cota da conta Codex estava
  esgotada em 2026-09-26. As reviews por task durante a execução foram de subagentes Claude, a
  mesma família do executor. Desvio declarado em `reviewer_exception`, autorizado por João em
  2026-09-26. Mesma classe de `D-27` e `D-32`.
  **Gatilho:** cota do Codex restabelecida para uma passada sobre `main..cb06414`, ou decisão de
  João de dispensá-la.

## Fechados

- **D-48 · o runbook descreve duas formas de emitir o certificado** — a secção 6.6 passou a
  descrever o recurso `AWS::CertificateManager::Certificate` no stack `lotus-dns` como caminho
  padrão, e manteve `aws acm request-certificate` como fallback declarado. Duas descrições da
  mesma coisa divergem com o tempo, e um certificado emitido pela CLI não é gerenciado pelo
  stack: o próximo deploy tentaria criar outro. Enquanto as duas convivem, **a do template
  vence**.
  **Gatilho:** ao emitir o certificado, no bloco da delegação.
  **Fechado em 2026-09-26.** O certificado saiu pelo template (commit `60dd2c2`), e a secção 6.6 do
  runbook agora diz que esse é o caminho em uso e que o fallback por CLI nunca foi executado. A
  regra de precedência ficou escrita no próprio runbook.
- **D-45 · a zona tem wildcard** — `*.lotusotec.cl` responde `A 185.146.167.195`, o mesmo IP do
  apex. Medido em 2026-09-09 por DNS-over-HTTPS: `zzz-nao-existe-19283.lotusotec.cl` e
  `outro-teste-aleatorio-77.lotusotec.cl` respondem esse IP. Duas consequências. **Primeira:**
  enumerar subdomínio por tentativa não prova nada, porque todo palpite responde — só o export BIND
  diz quais registros existem de verdade, e é por isso que ele é pendência e não zelo. **Segunda:**
  a zona nova precisa decidir entre reproduzir o wildcard ou removê-lo. Remover é o correto —
  wildcard esconde erro de digitação e faz qualquer subdomínio inventado apontar para o WordPress —
  mas remover sem o export derruba, sem aviso, subdomínio em uso que ninguém listou.
  Desfecho parcial em 2026-09-20 (`7.2.1`): a zona nova nasceu **sem** wildcard, e os dois nomes
  que dependiam dele e não podiam quebrar — `www` e `sistema` — nasceram explícitos. A decisão de
  remover está tomada e provada no template; o que continua aberto é a outra metade, a que só o
  export BIND resolve: **quais outros nomes existem**. Por isso a delegação não foi trocada.
  **Gatilho:** export BIND na mão de João.
  **Fechado em 2026-09-26.** Os prints do painel fecharam a outra metade — quais nomes existem —, e a
  delegação trocada provou o resto: os dois nomes inventados não resolvem mais em lado nenhum. O
  wildcard não atravessou, e o que ele escondia (`pop3`) entrou na cópia antes da troca.

- **D-44 · o acesso ao painel de DNS foi perdido** — o domínio é comprado na BlueHosting e a zona
  é gerenciada em `https://www.stackcp.com/` (Stack Control Panel). João informou em 2026-09-09
  que não tinha mais acesso; travava `B1` inteiro, e `B1` é o gargalo de `B2` a `B7`.
  **Fechado em 2026-09-20**, por confirmação de João de que o acesso à tela de nameservers
  voltou. É declaração, não medição nossa: quem executar a troca comprova na hora.
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
- **D-10 · Playwright cobre só Chromium** — **fechado em 2026-08-29** pelo bloco `6.1.1-6.3.1`
  (`6.1.4`): `playwright.config.ts` declara `chromium`, `firefox`, `webkit` e `mobile-webkit`; o
  fluxo principal (`home`, `menu`, `contacto`) roda nos quatro, e o CI instala os três motores.
  `a11y.spec.ts` e `seo.spec.ts` seguem só em Chromium — ver débito novo na homologação
  `docs/qa/homologacao-2026-08-29.md`.
- **D-11 · axe reporta mas não reprova** — **fechado em 2026-08-28** pelo bloco `5.1.1-5.3.2`
  (`5.2.4`): `e2e/a11y.spec.ts` audita cinco estados e reprova violação `critical`/`serious` sem
  exceção nominal em `e2e/a11y-exceptions.ts`; exceção órfã também reprova. As nove exceções
  iniciais viraram `D-21`.
- **D-14 · breakpoints exatos não medidos** — `05-layout.md` só prova que a virada do menu
  desktop/mobile e a do container `1080px` ficam entre `768` e `1440`; `1350px` é derivação da regra
  dos 80%, não largura medida. A EAP `3.2.10` precisa dos quatro viewports-alvo, não do valor exato,
  então o bloco não fica bloqueado — mas o clone escolhe um breakpoint sem medição que o confirme.
  **Fechado por este bloco** (`3.1.1`–`3.2.11`) em 2026-08-26 — o commit `chore(3.1.2)` mediu
  `900`–`1400` e `05-layout.md:64-76` registra as duas viradas; o clone usa `1000px`, medido.
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
- **D-33 · a prova ponta a ponta de `7.1.5` só existe depois do merge do PR** — **fechado em
  2026-09-10** pelo bloco `B0 · espelho-8982f50`. O que faltava era o pipeline se exercitando
  sozinho, com a role OIDC, em vez de simulação e inspeção de diff. As quatro evidências estão em
  [`docs/infra/evidencia-pipeline-2026-09-09.md`](../infra/evidencia-pipeline-2026-09-09.md):
  `procedencia` aceitou o espelho de `c6c6f9a` com `identical`; o `deploy` assumiu a role por OIDC e
  publicou `releases/f906926…/` no `lotus-site-prod`, promovendo a raiz e esperando a invalidação;
  o run de push em `main` do pessoal deixou o `deploy` como `skipped`; e um commit vazio empurrado
  direto no corporativo reprovou em `procedencia` com o `deploy` `skipped` por `needs`, sem alterar
  o que está no ar. O commit vermelho `3cd9619` fica no histórico do corporativo de propósito.
  Continuam abertos, e este bloco não os toca: `D-35` (preview/produção), `D-37` (rollback sem
  botão) e `D-43` (janela entre invalidação e limpeza).
