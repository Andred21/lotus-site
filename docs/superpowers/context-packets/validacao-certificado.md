---
schema_version: 1
work_item: validacao-certificado
notion_eap: null
status: partial
base_ref: feat/validacao-certificado
base_commit: e37b9d58437c337f6431b62a9fbcbf3fca2956f6
generated_at: 2026-11-24T19:15:43Z
---

# Context Packet — validacao-certificado

## Scope

A página de validação de certificado no lotus-site é a entrega 2 do bloco 61 do Lotus. Ela inclui a rota
`/validar/<uuid>` aberta pelo QR, o formulário de código + RUT, o download do PDF, as respostas 429
e a infraestrutura do site que a página exige: CloudFront em `/validar/*` e CSP. O packet reúne só o
que o planejamento precisa e não está no lotus-site: o contrato da API do Lotus, o estado da entrega 1
e as condições de teste. Quando algum fato do lotus-site muda o desenho, ele aparece citado por
`path:line`. O packet é evidência, não plano.

Proveniência git: `git status --short` → `?? .superpowers/`; `git rev-parse --abbrev-ref HEAD` →
`feat/validacao-certificado`; `git rev-parse HEAD` → `e37b9d58437c337f6431b62a9fbcbf3fca2956f6`.
O estado confere com `docs/superpowers/state.md:4-9` (`context_required`, `validacao-certificado`,
`active_notion_eap: null`).

**Quem gerou e emenda de Claude.** O packet foi gerado por `claude-isolado` em 2026-11-24, por
decisão de João, porque o Codex estava indisponível (`model_not_found`; desvio declarado em `D-85`).
Claude conferiu no `aba2b75e` os fatos de `cors.php`, `HandleCors.php`, `PublicCertificateData.php`,
`PublicCertificateAccess.php` e `LookupPublicCertificateData.php`, e todos bateram. Três citações de
linha estavam erradas e foram corrigidas: `aceitacao.md:57-58` passou a `aceitacao.md:12-13` (K7),
`aceitacao.md:58` passou a `aceitacao.md:13` (Acceptance signals 5), e `rulings.md:41` passou a
`rulings.md:13`. Os arquivos têm 13 e 17 linhas. Nenhuma outra parte do corpo foi alterada.

## Source registry

| id | tipo | identificador estável | acesso | lido em | situação |
|---|---|---|---|---|---|
| `J` | instrução do João | texto verbatim na entrada desta delegação, escrito em 2026-11-24 numa sessão do repositório do Lotus | entrada da delegação | 2026-11-24T19:09Z | lido |
| `R` | repositório local | `Andred21/lotus-site` @ `e37b9d58437c337f6431b62a9fbcbf3fca2956f6` (`feat/validacao-certificado`) | leitura local | 2026-11-24T19:09–19:15Z | lido |
| `L-SPEC` | repositório externo (spec) | `Andred21/lotus` @ `aba2b75e7fc7fc6c5b15ee257145f3ea79c7f15c` (`main`), `docs/superpowers/blocos/61-certificacao-validacao-no-site/spec.md` | `cat` só leitura em `/home/jvbat/projetos/lotus` | 2026-11-24T19:10Z | lido |
| `L-DOCS` | repositório externo (harness) | mesmo commit: `docs/superpowers/blocos/61-certificacao-validacao-no-site/{estado,aceitacao,rulings,revisao}.md`, `docs/superpowers/backlog.md`. Mais a observação só leitura de `git worktree list` e `docker volume ls` | `cat`/`grep`/`git log` só leitura | 2026-11-24T19:10–19:14Z | lido |
| `L-CODE` | repositório externo (código) | mesmo commit: `backend/**` (Certification, `config/cors.php`, Shared/Exceptions, Shared/Http, RateLimits, lang), `frontend/src/**` (ValidationPage, generated.ts, es-CL.json), `docker-compose.yml`, `.env.example`, `backend/.env.example`, `deploy/aws/env.prod.example` | `cat`/`grep` só leitura | 2026-11-24T19:11–19:15Z | lido |
| `W-APP` | API em produção | `https://app.lotusotec.cl/api/publico/certificados/consulta`: `GET` e `OPTIONS` com `Origin: https://lotusotec.cl` | `curl` | 2026-11-24T19:11:52Z | lido |
| `W-SITE` | site público | `https://lotusotec.cl/` (cabeçalhos) e `https://lotusotec.cl/validar/00000000-0000-4000-8000-000000000000` | `curl` | 2026-11-24T19:11:52Z | lido |
| `N` | Notion | `collection://2f0e72ec-ef53-4e08-a466-312de7eea7d2` | tentativa real: `ToolSearch` (`+notion`, `select:mcp__claude_ai_Notion__notion-search,…`) reconectou o servidor `claude.ai Notion`, que recusou a sessão por falta de login | 2026-11-24T19:13Z | `unavailable`: a tentativa de leitura falhou. A ferramenta existe na configuração, mas não está autenticada |
| `G` | Google Drive | — | não consultado. O work item não aponta planejamento canônico no Drive, e o contrato só manda usá-lo nesse caso | — | não aplicável |

Orçamento: 5 artefatos externos (`L-SPEC`, `L-DOCS`, `L-CODE`, `W-APP`, `W-SITE`). `N` não trouxe
conteúdo. `J` é instrução, e `R` é o repositório local. Cada `L-*` agrupa vários arquivos de um
mesmo commit, e cada fato cita `path:line`.

## Key facts

**K1 · Rotas JSON e respostas.**
- `GET https://app.lotusotec.cl/api/publico/certificados/{uuid}` → 200 com `PublicCertificateData`.
  Uuid inexistente → 404. A rota tem `whereUuid`, então um valor que não é uuid também dá 404 sem
  chegar ao controller.
- `POST …/consulta` com `Content-Type: application/json` e corpo `{codigo, rut}` → 200 com o payload
  e o `uuid` (forçado a 200, não 201).
- Código inexistente, RUT errado e snapshot sem RUT válido dão o mesmo 404, sem mensagem própria.
- 422 quando o formato falha, antes de qualquer consulta ao banco:
  - `codigo` não casa `^LOT-\d{4}-\d{1,9}$` (sem diferenciar caixa, até 20 caracteres);
  - `rut` passa de 20 caracteres ou tem o dígito verificador errado.
- Depois do deploy, um `GET` em `/consulta` dá 405.
- Snapshot corrompido → 500, com `detail` público.

Fontes: `L-SPEC` spec.md:97-119,220-224; `L-CODE` `backend/app/Domains/Certification/routes.php:9-23`,
`…/Http/Controllers/PublicCertificateController.php:19-39`, `…/Data/LookupPublicCertificateData.php:25-28`,
`…/Services/PublicCertificateAccess.php:57-83`, `…/Exceptions/CorruptedSnapshotException.php:43`.

**K2 · PDF público.**
- `GET …/{uuid}/pdf` → 200 com estes headers:
  - `Content-Type: application/pdf`;
  - `Content-Disposition: attachment; filename="certificado-<codigo>.pdf"`;
  - `Cache-Control: no-store`;
  - `X-Robots-Tag: noindex`.
- O PDF baixa para certificado vigente, por vencer e vencido.
- Revogado → 410 em `problem+json`, `type: https://lotus.cl/errors/gone`. O `detail` em es_CL é "El
  certificado fue revocado y su PDF ya no está disponible."
- Uuid inexistente → 404.
- O PDF é renderizado no Gotenberg a cada pedido.

Fontes: `L-SPEC` spec.md:121-133,225-226; `L-CODE` `PublicCertificateController.php:41-56`,
`PublicCertificateAccess.php:22-39`, `backend/app/Shared/Exceptions/TipoDeRecusa.php:35,53`,
`backend/lang/es_CL/certification.php:20`.

**K3 · Payload e página de referência.**
- O JSON vem sem envelope (`codigo` na raiz). Campos:
  - `codigo`;
  - `status`: `emitido` ou `revocado`;
  - `valido_ate`: data ou `null`;
  - `revoked_at`: ISO ou `null`;
  - `aluno.name`, `curso.name`, `curso.workload_hours`;
  - `turma.end_date`: data ou `null`;
  - `cliente.name`, `redator.name`;
  - `display_status`: `vigente`, `por_vencer`, `vencido` ou `revocado`, calculado no servidor no
    fuso de Santiago. O navegador não deriva esse estado.
  - `uuid`: só na resposta da consulta.
- Nenhum campo traz RUT.
- A `ValidationPage` do app é referência funcional, não visual:
  - `revocado` → cartão de revogado com `revoked_at`;
  - `vencido` → cartão de vencido;
  - os demais → cartão válido com código, aluno, curso · horas, término e `valido_ate`;
  - omite `cliente` e `redator` de propósito ("dados mínimos");
  - 404 → "Certificado no encontrado" + "Verifica el código impreso en el documento o contacta a
    Lotus.", o beco sem saída que a D-70 do Lotus descreve.

Fontes: `L-CODE` `backend/app/Domains/Certification/Data/PublicCertificateData.php:16-46`,
`frontend/src/shared/types/generated.ts:133,166,449-472`, `…/Enums/CertificateDisplayStatus.php:10-60`,
`backend/tests/Feature/Certification/PublicCertificateLookupTest.php:54-56`,
`frontend/src/features/certification/components/Validation/ValidationPage.tsx:10-56`,
`frontend/src/features/certification/hooks/useValidationPage.ts:28-37`,
`frontend/src/shared/config/locales/es-CL.json:1074-1088`.

**K4 · Envelope de erro e idioma.**
- Todo erro sai como `application/problem+json` com `{type,title,status,detail,instance}`.
- O 422 acrescenta `errors` por campo.
- Os headers da exceção, como o `Retry-After`, chegam à resposta.
- Idioma:
  - vale o primeiro item do `Accept-Language` que esteja entre `en`, `es_CL` e `pt_BR`;
  - qualquer outro valor cai no fallback `es_CL`;
  - o navegador envia `Accept-Language` sozinho, então quem usa navegador em inglês recebe texto em
    inglês.
- O `detail` do 429 é o mesmo para os dois limites: "Demasiadas solicitudes. Espere unos segundos y
  vuelva a intentarlo." Esse texto não serve para o bloqueio de 1 h.

Fontes: `L-CODE` `backend/app/Shared/Exceptions/ProblemDetails.php:24-61,98`,
`backend/app/Shared/Http/Middleware/SetLocale.php:17-38`, `backend/lang/es_CL/problem.php:13,18`.

**K5 · Limites e `Retry-After`.**
- Limites por IP:
  - consulta: 10/min;
  - `GET` por uuid: 30/min;
  - PDF: 10/min.
- Limites de falha da consulta:
  - 20 falhas/h por IP;
  - 10 falhas/h por RUT, com chave HMAC.
- Só o 404 conta como falha. Estourado o limite, a consulta recusa com 429 antes do banco, mesmo para
  o par certo.
- `Retry-After`:
  - no limite por minuto, vale no máximo 60;
  - no bloqueio de falhas, são os segundos que faltam no balde estourado mais longo
    (`availableIn`). O valor vai de 1 a 3600 e decresce.
- Regra que `J` e o §7 dão à página:
  - até 60 s, pedir para tentar de novo;
  - acima disso e até 3600 s, a consulta está travada e a página oferece o QR (`/validar/<uuid>`),
    que não passa pelo limite de falhas.
- No fim do bloqueio de 1 h, o valor cai abaixo de 60 e a página o trata como limite por minuto. A
  espera mostrada continua certa.
- Risco aceito na spec: quem conhece o RUT de outra pessoa trava a consulta dela por até 1 h com 10
  falhas.

Fontes: `J`; `L-SPEC` spec.md:135-160,227-235; `L-CODE`
`backend/app/Shared/RateLimiting/RateLimits.php:39,64-76`, `PublicCertificateAccess.php:85-107`.

**K6 · CORS e ambiente local.**
- A política do site vale só em `api/publico/*` e só para uma origem exata de `CORS_PUBLIC_ORIGINS`.
  A lista não aceita curinga.
  - Métodos: `GET`, `POST`, `OPTIONS`.
  - Headers aceitos: `Content-Type`, `Accept` e `Accept-Language`. Qualquer outro header reprova o
    preflight.
  - Headers expostos: `Content-Disposition` e `Retry-After`.
  - Sem `Allow-Credentials`.
- Origem fora da lista cai na política do app (`FRONTEND_URL`, com credenciais).
- Valores de cada ambiente:
  - produção: `CORS_PUBLIC_ORIGINS=https://lotusotec.cl`, no molde de `env.prod.example`;
  - local: a chave vem vazia em `backend/.env.example`;
  - na árvore principal do Lotus (offset 0), a API fica em `:8080` e o app em
    `FRONTEND_URL=http://localhost:5173`.
- O `vite.config.ts` do site não fixa `server.port`, então o Vite usa a porta padrão, 5173. Se o site
  rodar em 5173, ele recebe a política do app em vez da pública, e o teste local deixa de provar o
  CORS real.

Fontes: `J`; `L-SPEC` spec.md:162-173; `L-CODE` `backend/config/cors.php:18-32,47-55`,
`backend/app/Shared/Http/Middleware/HandleCors.php:57-66`, `backend/.env.example:48,52`,
`.env.example:11-28`, `docker-compose.yml:18`, `deploy/aws/env.prod.example:89`; `R` `vite.config.ts:8-17`.

**K7 · Estado da entrega 1 e sequência.**
- O bloco 61 foi mesclado na `main` do Lotus (PR #176, merge `6632dd93`, 2026-11-24 15:46 -03). Ele
  está em `blocked`, aguardando a aceitação:
  - item 1, pôr `CORS_PUBLIC_ORIGINS` no `.env` de produção: sem resultado;
  - item 2, deploy: medido em 2026-11-24 com `404`, quando o esperado era `405`.
- A sondagem deste packet confirma que a API nova não está em produção:
  - `GET /consulta` → 404;
  - o preflight com `Origin: https://lotusotec.cl` devolve
    `Access-Control-Allow-Origin: https://app.lotusotec.cl` e `Access-Control-Allow-Credentials: true`,
    que é a política antiga.
- A ficha 63 do Lotus faz a virada: QR novo com `CERTIFICATE_VALIDATION_URL=https://lotusotec.cl`,
  `301` do QR antigo e saída da `ValidationPage`. Ela só abre depois que a página do site estiver no
  ar e provada em `lotusotec.cl/validar/<uuid>`.
- O QR imprime `<base>/validar/<uuid>`, sem barra final.

Fontes: `L-DOCS` `estado.md:5-8,21`, `aceitacao.md:12-13`, `docs/superpowers/backlog.md:436-470`,
`git log` do `6632dd93`; `L-CODE` `backend/app/Domains/Certification/Services/CertificateValidationUrl.php:39-41`;
`W-APP`.

**K8 · O que o lotus-site tem hoje e a página afeta.**
- CloudFront:
  - a distribuição não tem `CustomErrorResponses`. Caminho inexistente dá 404, e não existe fallback
    de SPA, por decisão;
  - ao vivo, `https://lotusotec.cl/validar/<uuid>` responde 404 com `application/xml`;
  - o behavior `/api/*` já vai para a Lambda de contato, então a validação não pode passar por um
    proxy em `/api/` na mesma origem;
  - o behavior padrão tem uma CloudFront Function `viewer-request` que redireciona `www` para o apex.
- CSP:
  - `connect-src 'self'` está em dois lugares: o template `infra/lotus-site.yaml:156` e o módulo
    `scripts/infra/lib/cabecalhos.mjs:24`;
  - o `vite preview` serve o módulo ao E2E, e a catraca `scripts/infra/cabecalhos.test.mjs:207`
    exige que o módulo seja igual ao template;
  - o `page.route` do Playwright intercepta depois da checagem de CSP. Mesmo com a rede falsa, o E2E
    precisa de `https://app.lotusotec.cl` no `connect-src`.
- Código:
  - há uma entrada só (`src/main.tsx`) e nenhum roteador nas dependências;
  - `zod` já é dependência;
  - a âncora `#Contacto` existe.

Fontes: `R` `infra/lotus-site.yaml:155-156,283-309`, `scripts/infra/lib/cabecalhos.mjs:20-32`,
`vite.config.ts:10-16`, `docs/adr/ADR-SITE-004.md:284-285`,
`docs/superpowers/specs/2026-09-27-7.2.2-headers-hardening-design.md:259-264`, `src/main.tsx:1-13`,
`package.json:36-43`, `src/components/sections/Contacto.tsx:19`; `W-SITE`.

## Resolved divergences

Divergências não materiais. Ficam registradas as duas leituras, e nenhuma decisão de João foi tomada
em silêncio.

1. **Dois "D-70".**
   - No lotus-site, `D-70` é "o bloco `7.2.6` não tem segunda lente" (`R`
     `docs/superpowers/backlog.md:957`).
   - No Lotus, `D-70` é "`/validar` diz 'contacta a Lotus' sem canal" (`L-DOCS`
     `docs/superpowers/backlog.md:510-513`).
   - `J` e `L-SPEC` spec.md:239 falam da D-70 do Lotus, e o contexto não deixa dúvida.
   - Consequência: o planejamento deve escrever "D-70 do Lotus" para não colidir com o ID local.
2. **`Retry-After` exposto.**
   - `L-DOCS` `rulings.md:13` registra que o `Retry-After` não estava exposto e que o §7 não trazia a
     saída pelo QR.
   - O commit `b9bc4925` corrigiu as duas coisas, e no `aba2b75e` valem `L-CODE` `cors.php:52` e
     `L-SPEC` spec.md:227-235.
   - Este packet segue o HEAD. Seguir o ruling antigo levaria a página a não ler o tempo de espera.
3. **`app.lotusotec.cl` na porta 443.**
   - `R` `scripts/infra/lib/cabecalhos.mjs:39` diz que o host "não responde em 443".
   - `W-APP` respondeu em HTTPS (HTTP/2).
   - O comentário justifica o HSTS sem `includeSubDomains`, assunto fora deste item. Para saber se a
     API é alcançável, vale a sondagem ao vivo. O comentário está desatualizado.

## Constraints

- O RUT só viaja no corpo do `POST`. Nunca vai para URL, query string, log nem armazenamento do
  navegador. Fontes: `L-SPEC` spec.md:69,99-100.
- O `fetch` sai sem credenciais. O site é same-site com o app, e a API nunca concede credencial à
  origem do site. Fontes: `L-SPEC` spec.md:89-92,166; `L-CODE` `cors.php:54`.
- A página não distingue os motivos do 404 nem afirma que um código existe. Fontes: `J`; `L-SPEC`
  spec.md:67,111-113.
- `/validar/*` é servido sem o fallback genérico. Caminhos fora de `/validar/` continuam 404.
  Fontes: `J`; `L-SPEC` spec.md:237; `R` `docs/adr/ADR-SITE-004.md:284-285`.
- `connect-src` inclui `https://app.lotusotec.cl` no template e no módulo da CSP. Fontes: `J`;
  `L-SPEC` spec.md:238; K8.
- O link para `/#Contacto` só entra com o aceite da Lotus à D-70 do Lotus. Fontes: `J`; `L-SPEC`
  spec.md:239; `L-DOCS` `backlog.md:510-513`.
- A página fica no layout do site. O certificado tem peso legal: o site só consome o PDF e não o
  altera. Fontes: `L-DOCS` `backlog.md:374-376`; `L-SPEC` spec.md:246.
- Sem dependência nova sem necessidade (Lei 7): `zod` já está instalado, e não há roteador. Fontes:
  `R` `CLAUDE.md` §5; `package.json:36-43`.
- Teste local contra o stack do Lotus: API em `http://localhost:8080` e
  `CORS_PUBLIC_ORIGINS=http://localhost:<porta do site>` no `backend/.env` do Lotus, com a porta
  diferente de 5173 (K6). O teste contra produção só funciona depois do deploy do passo 2. Fontes:
  `J`; K6; K7.
- A URL base da API muda entre local (`http://localhost:8080`) e produção (`https://app.lotusotec.cl`).
  Fonte: `J`.

## Acceptance signals

1. `https://lotusotec.cl/validar/<uuid>` responde 200 com a página. Um caminho inventado fora de
   `/validar/` continua 404. Fontes: `J`; K8.
2. A CSP tem `connect-src 'self' https://app.lotusotec.cl` no template e no módulo, a catraca
   `template ≡ módulo` fica verde, e o E2E sob CSP passa com zero violação. Fontes: `J`; K8.
3. O E2E (`pnpm e2e`) cobre:
   - 200 em cada `display_status`;
   - o 404 único da consulta;
   - 422;
   - 429 com espera de até 60 s;
   - 429 acima de 60 s, oferecendo o QR;
   - PDF 200 com o nome tirado do `Content-Disposition`;
   - PDF 410;
   - erro 500 genérico;
   - o RUT nunca aparece na URL.

   Fontes: `J`; K1–K5.
4. Prova local contra o stack do Lotus (`:8080`), com origem própria em `CORS_PUBLIC_ORIGINS` e um
   certificado de demonstração. Fontes: `J`; K6.
5. Prova em produção depois do deploy do 61:
   - `GET /consulta` → 405;
   - o preflight devolve `Allow-Origin: https://lotusotec.cl`, sem `Allow-Credentials`;
   - a página resolve um uuid real.

   Fontes: `J`; `L-DOCS` `aceitacao.md:13`; `W-APP`.
6. A página no ar e provada em `lotusotec.cl/validar/<uuid>` é a condição para abrir a ficha 63 do
   Lotus. Fonte: `L-DOCS` `backlog.md:461-463`.

## Open questions

1. **D-70 do Lotus.** A Lotus aceitou o canal `#Contacto` do site? Sem o aceite, a página sai sem o
   link. Fontes: `J`; `L-DOCS` `backlog.md:510-513`. Decisão: João/Lotus.
2. **Rota do formulário.** Onde fica o formulário de código + RUT (`/validar`, `/validar/` ou outro
   caminho)? Depois do 200, a página navega para `/validar/<uuid>` ou mostra o resultado no lugar?
   Nenhuma fonte fixa isso: o §1 diz só "em `lotusotec.cl/validar/<uuid>` e com formulário"
   (`L-SPEC` spec.md:19), e o DoD da ficha 61 diz que "o código digitado chega ao mesmo resultado"
   (`L-DOCS` `backlog.md:396-397`). Decisão: planejamento/João.
3. **Campos exibidos.** O payload traz `cliente` e `redator`, e a página do app os omite por "dados
   mínimos" (K3). Mostrar ou não? Decisão: João.
4. **Certificado de demonstração.** O worktree da lane 61 não aparece mais em `git worktree list`, e o
   único volume de banco do Lotus é `lotus_lotus-db`, da árvore principal (`L-DOCS`, observação de
   2026-11-24T19:14Z). O `LOT-2026-9001` citado em `J` provavelmente sumiu com a lane. Qual
   certificado usar no stack local (`:8080`), e quem o cria? Decisão: João.
5. **Idioma das mensagens.** A página envia `Accept-Language: es-CL` ou escreve todas as mensagens por
   conta própria, sem depender do texto da API (K4)? Decisão: planejamento.
6. **Notion.** O item deve ganhar task ou EAP no Notion? A fonte `N` ficou indisponível nesta sessão.
   Decisão: João. Essa lacuna é o que leva o packet a `status: partial`. Ela não bloqueia, porque o
   estado declara `active_notion_eap: null` e o item foi selecionado explicitamente.

## Staleness triggers

- Um commit novo em `Andred21/lotus` `main` depois de `aba2b75e` que toque
  `backend/app/Domains/Certification/**`, `backend/config/cors.php`,
  `backend/app/Shared/Http/Middleware/HandleCors.php`,
  `backend/app/Shared/RateLimiting/RateLimits.php`,
  `backend/app/Shared/Exceptions/ProblemDetails.php`, `backend/lang/*/problem.php` ou o §7 da spec do
  61 obriga a reler K1–K6.
- O `estado.md` do bloco 61 sair de `blocked`, ou o item 2 da `aceitacao.md` virar OK, obriga a sondar
  `W-APP` de novo (K7).
- A abertura da ficha 63, ou uma mudança em `CertificateValidationUrl.php`, obriga a reler K7.
- Uma decisão da Lotus sobre a D-70 do Lotus responde a Open question 1.
- Um commit novo no lotus-site depois de `e37b9d5` que toque `infra/lotus-site.yaml`,
  `scripts/infra/lib/cabecalhos.mjs` ou `vite.config.ts` obriga a reler K8.
- Uma mudança nos cabeçalhos ou nas respostas de `https://lotusotec.cl` obriga a sondar `W-SITE` de
  novo.
- Com o acesso ao Notion restaurado, consultar `N`.
- Um stack local do Lotus recriado ou semeado de novo muda a Open question 4.
