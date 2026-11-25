# Spec — `validacao-certificado` · Página de validação de certificado no site

> Work item: `validacao-certificado` · Branch: `feat/validacao-certificado` · Base: `e36ce0c`
> Context Packet: `docs/superpowers/context-packets/validacao-certificado.md` (citado como `K1`–`K8`).
> Contrato da API: §7 de `docs/superpowers/blocos/61-certificacao-validacao-no-site/spec.md` do
> repositório `Andred21/lotus`, no commit `aba2b75e`.

## 1. Objetivo

A Lotus quer que a validação de certificado saia do app (`app.lotusotec.cl/validar/<uuid>`) e passe
a viver no site institucional. Quem recebe um certificado, como a empresa contratante ou a
fiscalização, confere pelo QR ou digitando o N° de registro com o RUT do aluno, e baixa o PDF quando
ele não está revogado. O certificado tem peso legal: a página tem de dizer a verdade sobre o estado,
nunca vazar dado pessoal e nunca confirmar que um código existe sem o RUT certo.

O trabalho é a **entrega 2** de três (spec do 61, §1):

1. a API pública, no Lotus (bloco 61, mesclado, aguardando deploy em produção — `K7`);
2. **esta página**, no lotus-site;
3. a virada do QR para o site, no Lotus (ficha 63), que só abre depois desta página no ar.

O bloco entrega:

1. **a página** em `/validar` (formulário de código + RUT) e `/validar/<uuid>` (QR), no layout do
   site;
2. **o item "Validar Certificado" no menu do topo**, no desktop e no mobile;
3. **a borda**: `/validar` e `/validar/<uuid>` servidos por reescrita explícita, sem fallback
   genérico, e `connect-src` com `https://app.lotusotec.cl` nos dois lugares da CSP;
4. **o deploy e o rollback** tratando a segunda página HTML como arquivo de nome fixo;
5. **a `ADR-SITE-007`**, que registra o formato "um HTML por página, sem router".

Sucesso: o QR de um certificado abre a página com o estado certo; código + RUT chegam ao mesmo
cartão; o PDF baixa com o nome do `Content-Disposition` e é recusado para revogado; o bloqueio de 1 h
oferece o QR; caminho inventado continua 404; a home só muda no item novo do menu.

## 2. Escopo negativo

- **Nada no Lotus.** API, CORS, limitadores, QR, `CERTIFICATE_VALIDATION_URL`, `301` e
  `ValidationPage` são do Lotus (entregas 1 e 3).
- **Sem router e sem fallback genérico** (D5, D6).
- **Sem link para `/#Contacto` na página** até a Lotus aceitar a D-70 do Lotus (D4). O "D-70" deste
  documento é sempre o do Lotus; o `D-70` do backlog local é outro assunto (packet, divergência 1).
- **Sem leitor de QR por câmera**, sem lote, sem planilha.
- **Nenhuma mudança no conteúdo do PDF.** O site só o baixa.
- **O resto da home não muda.** Só o menu (D2) e o `href` das âncoras (D7).
- **Sem dependência nova** (Lei 7): `zod` já está instalado.

### Anti-objetivos — falha mesmo que funcione

- o RUT na URL, em query string, em `localStorage`/`sessionStorage`, em log do console ou em qualquer
  pedido que não seja o corpo do `POST /consulta`;
- uma mensagem, um estado visual ou um tempo de resposta da página que distinga código inexistente
  de RUT errado;
- `fetch` com `credentials` diferente de `omit` para a API (o site é same-site com o app, `K6`);
- `/qualquer-coisa` ou `/validar/nao-e-uuid` respondendo 200;
- `/validar/<uuid>` indexável (a página mostra o nome do aluno);
- `validar/index.html` publicado com cache `immutable`.

## 3. Decisões

`S-JOAO` é decisão do João nesta conversa (2026-11-24); `Claude` é decisão minha, apresentada e não
contestada, ou deixada aqui para ele conferir.

### D0 — Context Packet por `claude-isolado` · `S-JOAO`

O Codex estava indisponível (`model_not_found`). O packet saiu de `claude-isolado`, e o desvio é a
`D-85`.

### D1 — Página no site, no layout dele · `S-JOAO`

Header e Footer do site, os mesmos componentes da home. Idioma: espanhol, como o site.

### D2 — "Validar Certificado" no menu do topo · `S-JOAO`

Quinto item, depois de "Contacto", em `site.nav`; aparece no menu desktop e no `MobileMenu`. Motivo:
o PDF impresso traz o QR e "N° LOT-…", sem endereço para digitar
(`certificate.blade.php:293-294,335` do Lotus), então quem não lê o QR chega pela home. Em
`/validar`, o item leva `aria-current="page"` e fica branco com sublinhado da cor `brand`, como no
mockup aprovado; na home, nenhum item fica marcado (como hoje). No `MobileMenu`, cujo painel é
branco com texto `neutral-ink`, o item atual mantém a cor do texto e ganha o mesmo sublinhado
`brand` (`Claude`: o mockup só mostrou o desktop, e branco sobre branco sumiria).

### D3 — Layout A: faixa preta com cartão claro · `S-JOAO`

No molde do bloco "Contáctenos" da home: faixa `ink`, kicker branco espaçado, título `brand` em
Montserrat, texto de abertura branco e o formulário num cartão `surface` com os campos de linha
inferior do `ContactForm`. O cartão de resultado usa o mesmo fundo claro. Mockups aprovados em
`.superpowers/brainstorm/1169933-1795549232/content/` (`pagina-formulario.html`, opção A, e
`resultado-estados.html`), fora do Git; o texto aprovado está reproduzido em §5.4.

### D4 — Estados do resultado · `S-JOAO`

Aprovados na tela `resultado-estados.html` ("Tudo correto"):

- **Campos:** N° de registro, aluno, curso · horas, término e "Válido hasta". **Cliente e redator
  ficam fora**, como na `ValidationPage` do app, que os omite por "dados mínimos" (`K3`).
- **Vigente e por vencer** mostram o cartão válido com "DESCARGAR PDF"; por vencer acrescenta a linha
  "Próximo a vencer". Quem decide o estado é o `display_status` da API; a página não calcula nada.
- **Data ausente:** `valido_ate` nulo é vigente sem prazo, o caso comum
  (`CertificateDisplayStatus.php:49,63` do Lotus); `turma.end_date` também pode ser nulo. A linha
  correspondente ("Válido hasta" ou "Término") é omitida, como na `ValidationPage` do app
  (`ValidationPage.tsx:42-49`). Decisão minha (`Claude`), seguindo o app.
- **Vencido baixa o PDF**, com "Venció el" no lugar de "Válido hasta".
- **Revogado** não tem botão de PDF e mostra a data de revogação.
- **Mensagens próprias, em espanhol.** A página nunca exibe `title`/`detail` da API: o 429 da API
  tem o mesmo texto para os dois limites e o idioma segue o navegador (`K4`).
- **Não encontrado** é uma frase só para código inexistente, RUT errado e aluno sem RUT.
- **429** com `Retry-After` ≤ 60: contagem regressiva e botão desativado. Acima de 60: consulta
  bloqueada, com o tempo em minutos e a orientação de escanear o QR.
- **422** vira erro no próprio campo; o formato é conferido antes de enviar.
- **Rede ou 500** viram uma frase genérica, sem detalhe.
- **Sem link de contato** até a D-70 do Lotus ser aceita.
- **Cores de estado novas**: verde, âmbar e o `danger` existente, com contraste AA.

### D5 — Duas páginas HTML e reescrita explícita na borda · `S-JOAO`

O Vite gera `validar/index.html` como segunda entrada. A função `viewer-request` do behavior padrão
passa a servir `/validar/index.html` para exatamente três formas de caminho (§5.1); todo o resto
segue como hoje, e caminho sem objeto continua 404. Abordagens descartadas em §4.

### D6 — Sem router · `S-JOAO`

João perguntou se não valia pôr um router pensando em expandir o site. Decidido que não: um router no
navegador exige a borda servindo o mesmo `index.html` (fallback genérico ou lista de rotas) e põe o
`<head>` da home em toda rota; o caminho para um site maior é um framework com pré-renderização,
decidido em bloco próprio. A `ADR-SITE-007` registra isso, e a rule de arquitetura troca a linha
"não adicionar router enquanto a navegação continuar sendo uma única página por âncoras".

### D7 — Âncoras do menu viram `/#…` · `Claude`

`#Somos`, `#Cursos` e `#Contacto` passam a `/#Somos`, `/#Cursos` e `/#Contacto` em `site.nav`. Em
`/validar` eles levam à home na seção certa; na home o navegador trata como navegação no mesmo
documento, sem recarregar. "Inicio" continua `/`. Qualquer outro `href="#…"` da home que precise
funcionar a partir de `/validar` segue a mesma regra; os que só existem na home ficam como estão.

A home é renderizada no navegador (`createRoot`), então ao chegar de `/validar` a seção pode ainda
não existir quando o navegador procura o fragmento, e a página fica no topo. Se o teste de A5 mostrar
isso em algum motor, entra na home a correção mínima: rolar até o fragmento depois da montagem. É a
única mudança de código da home além do menu, e só entra com o teste vermelho antes.

### D8 — O formulário não troca a URL · `S-JOAO`

Depois de um 200 da consulta, o cartão aparece abaixo do formulário e a URL continua `/validar`. O
`uuid` da resposta fica só em memória, para o PDF, e não entra no histórico de quem consultou. Pelo
QR (`/validar/<uuid>`), a faixa mostra só o cartão e o link "Validar otro certificado" para
`/validar`.

### D9 — `noindex` nas duas formas, fora do sitemap · `Claude`

`validar/index.html` serve `/validar` e `/validar/<uuid>` com o mesmo arquivo, então leva
`<meta name="robots" content="noindex">` estático, sem `canonical`, `og:*` nem JSON-LD. Não entra
no `sitemap.xml`; `robots.txt` não muda (um `Disallow` impediria o robô de ver o `noindex`). Motivo:
a forma do QR mostra o nome do aluno. Quem procura "validar certificado Lotus" cai na home, que tem o
item no menu.

### D10 — URL da API por variável de build · `Claude`

`VITE_CERTIFICADOS_API_URL`, com padrão `https://app.lotusotec.cl` no código. O build de produção não
define a variável. O teste local usa `http://localhost:8080`. Uma origem diferente da padrão em
produção é bloqueada pela CSP, o que é o comportamento certo. A variável entra em `.env.example` e em
`src/vite-env.d.ts`.

### D11 — Dev e preview reproduzem a borda · `Claude`

`appType: 'mpa'` no Vite, para o dev e o preview responderem 404 a caminho inexistente como a borda
(hoje o fallback de SPA do Vite devolve a home para qualquer caminho), e um plugin que reescreve as
mesmas três formas de §5.1 para `/validar/index.html` no dev e no preview. A regra existe em dois
lugares — a função no template e o plugin — e **uma tabela única de casos** prova que os dois decidem
igual: o teste roda a tabela contra a função do template em `node:vm` e contra o casamento do plugin.

### D12 — Uma função só, `www` primeiro · `Claude`

O CloudFront aceita uma função `viewer-request` por behavior, e o padrão já tem a de `www`. A mesma
função faz as duas coisas, nesta ordem: `www` → `301` para o apex (inalterado, caminho e query
preservados); depois, reescrita de `/validar`. O recurso mantém o nome lógico `RedirecionarWww` e o
`Name` atuais, para não trocar a função no stack; o `Comment` e o comentário do template passam a
descrever os dois papéis. `/api/*` continua sem função.

### D13 — Ordem de publicação · `Claude`

O item do menu vai ao ar com o deploy do site. Se o site publicar antes de a API do 61 estar em
produção, o menu leva a uma página que só mostra erro. Ordem:

1. a API do 61 responde em produção do jeito que a página precisa: `GET /consulta` → 405 (item 2 da
   aceitação do 61) **e** o preflight com `Origin: https://lotusotec.cl` devolve esse
   `Access-Control-Allow-Origin`, sem `Allow-Credentials`. O segundo teste prova o item 1 de lá
   (`CORS_PUBLIC_ORIGINS` no `.env` de produção): a checagem de alinhamento do Lotus confere que a
   chave existe, não o valor;
2. João aplica o change set de `infra/lotus-site.yaml` (CSP e função). Pode ser antes, até durante
   a execução: sem `validar/index.html` no bucket, a reescrita cai num objeto inexistente e dá 404,
   como hoje, e um `connect-src` a mais não muda a home;
3. merge do PR, espelho para o corporativo e deploy do CI;
4. prova em produção (§8, A8).

**O PR fica aberto até o passo 1** (`S-JOAO`, 2026-11-24). `/fechar-site` abre o PR normalmente, e
João só o mescla quando a API responder em produção. Assim a `main` continua livre para outros
blocos e nada novo é construído para esconder a página. Foram descartados mesclar e congelar o
espelho, que prenderia qualquer outro release do site, e uma chave de build que esconda o item e a
página, que custaria variável, testes dos dois estados, mudança no CI e no smoke e um bloco depois
para removê-la.

### D14 — Onde cada prova acontece · `Claude`

O aceite do bloco é provado com a API simulada no E2E e contra o stack local do Lotus. A prova em
produção depende do deploy do Lotus e fica como pendência registrada no fechamento (§10), não como
condição do PR.

### D15 — Fluxo de validação nos quatro motores · `Claude`

O QR é aberto no celular. O spec E2E da validação entra em `FLUXO_PRINCIPAL` do
`playwright.config.ts` (Chromium, Firefox, WebKit e `mobile-webkit`, que é o iPhone 13).

### D16 — `Retry-After` ausente ou não numérico · `Claude`

A API manda segundos inteiros (`K5`). Valor ausente, não inteiro ou ≤ 0 vira espera sem número:
"Demasiadas consultas seguidas. Intente de nuevo en unos momentos." e o botão é reativado em 60 s.
Formato data-HTTP não é interpretado.

### D17 — Datas · `Claude`

`valido_ate` e `turma.end_date` chegam como `AAAA-MM-DD` e são datas civis: formatadas sem fuso, sem
passar por `new Date('AAAA-MM-DD')`, que as leria como meia-noite UTC e mostraria o dia anterior no
Chile. `revoked_at` chega em ISO UTC e é exibida em `America/Santiago`. Formato longo `es-CL`:
"12 de agosto de 2026".

### D18 — Comentário de `app.lotusotec.cl` em `cabecalhos.mjs` · `Claude`

`scripts/infra/lib/cabecalhos.mjs:39` diz que `app.lotusotec.cl` não responde em 443; a sondagem do
packet viu HTTPS respondendo. O comentário justifica o HSTS sem `includeSubDomains`, que continua
certo só por `mail.lotusotec.cl`. Como o arquivo é tocado neste bloco, o comentário é corrigido para
dizer isso; a decisão de HSTS não muda.

## 4. Abordagens consideradas

| Abordagem | Como | Por que não |
|---|---|---|
| **1. Duas páginas HTML + reescrita explícita** (escolhida) | `validar/index.html` próprio; a função manda três formas de caminho para ele | — custa mexer no deploy do CI e no rollback, que tratam `index.html` por nome exato (§5.6) |
| 2. Uma página só + reescrita para `/index.html` | o `App` decide pelo `pathname` e carrega a validação sob demanda | `/validar/<uuid>` herdaria `canonical` de `/`, `og:*`, JSON-LD e o preload da imagem do hero; corrigir exigiria reescrever o `<head>` em JavaScript |
| 3. Router (`react-router`) + lista de rotas na borda | navegação no cliente | dependência nova para duas páginas ligadas por `<a>`; mesmo problema de `<head>` da 2; ver D6 |
| 4. Fallback genérico (`CustomErrorResponses` 404 → `index.html`) | qualquer caminho serve a home | proibido pela `ADR-SITE-004`: qualquer caminho inventado responderia 200 |
| 5. Hash ou query (`/validar#<uuid>`) | sem mudança na borda | o QR impresso usa o caminho fixo `/validar/<uuid>` (`CertificateValidationUrl.php:39-41`, `K7`) |

## 5. Desenho

### 5.1 Borda

A função de `infra/lotus-site.yaml` (`RedirecionarWww`) ganha, depois do ramo de `www`:

| Caminho pedido (`request.uri`) | Vira |
|---|---|
| `/validar` | `/validar/index.html` |
| `/validar/` | `/validar/index.html` |
| `/validar/<uuid>` — 8-4-4-4-12 hexadecimal, sem diferenciar caixa | `/validar/index.html` |
| qualquer outro, inclusive `/validar/abc`, `/validar/<uuid>/`, `/validar/<uuid>/x`, `/validarx` | inalterado (o S3 responde 404 se não houver objeto) |
| `/validar/index.html` | inalterado: o objeto existe e responde 200, como `/index.html` já responde hoje (`Claude`) |

A query string atravessa a reescrita sem mudança. Com a reescrita no `viewer-request`, a chave de
cache é o caminho reescrito, então todo uuid compartilha o objeto `validar/index.html`. A
`Referrer-Policy` atual (`strict-origin-when-cross-origin`) faz o `fetch` à API mandar só a origem,
sem o uuid do caminho.

A catraca `scripts/infra/distribuicao.test.mjs` já extrai a função do template e a roda em
`node:vm`; ela passa a rodar a tabela de casos de D11 e continua provando o ramo de `www`, inclusive
para `https://www.lotusotec.cl/validar/<uuid>` → `301` para o apex com o caminho preservado.

### 5.2 CSP

`connect-src 'self' https://app.lotusotec.cl` em `scripts/infra/lib/cabecalhos.mjs` e na string de
`infra/lotus-site.yaml`; a catraca `cabecalhos.test.mjs` continua exigindo os dois iguais. Nenhuma
outra diretiva muda. O download do PDF por `blob:` com `<a download>` não depende de CSP.

### 5.3 Build, dev e preview

- `vite.config.ts`: duas entradas (`index.html` e `validar/index.html`), `appType: 'mpa'` e o plugin
  de D11 em `configureServer` e `configurePreviewServer`. O plugin `preloadCritical` continua
  atuando só onde há o que pré-carregar; `validar/index.html` não ganha o preload do hero.
- `validar/index.html`: `lang="es"`, `<title>Validar certificado | LOTUS OTEC</title>`, `noindex`
  (D9), o mesmo favicon e as mesmas fontes da home, sem script inline (CSP `script-src 'self'`).
- A segunda entrada tem o próprio `main` e compõe Header, a página e Footer. A composição mora em
  `src/app/`, o único lugar que liga integração a componente.
- Se algum script de build novo (plugin, tabela de casos) ficar fora de `src/`, ele entra no
  `include` de `tsconfig.node.json`.

### 5.4 Página

**Rota.** A página lê `location.pathname` uma vez: `/validar/<uuid>` é o modo QR, e o resto é o
modo formulário. Nada de roteador nem de `history.pushState` (D6, D8).

**Texto aprovado** (mockups D3 e D4). String repetida vive em `src/content/`.

| Onde | Texto |
|---|---|
| kicker | CERTIFICADOS LOTUS OTEC |
| título | VALIDAR CERTIFICADO |
| abertura | Ingrese el N° de registro y el RUT del alumno, tal como aparecen en el certificado. |
| campo 1 / exemplo | N° de registro / Ej.: LOT-2026-123 |
| campo 2 / exemplo | RUT del alumno / Ej.: 12.345.678-5 |
| botão | VALIDAR |
| linha do QR | ¿Tiene el certificado a mano? Escanee el código QR: abre la validación directamente. |
| modo QR, link | Validar otro certificado |
| vigente | VIGENTE · Certificado válido |
| por vencer | o mesmo cartão + "Próximo a vencer" |
| vencido | VENCIDO · Certificado vencido · "Venció el" · El certificado fue emitido por Lotus OTEC, pero ya no está vigente. |
| revogado | REVOCADO · Certificado revocado · "Revocado el" · Este certificado fue revocado por Lotus OTEC y no tiene validez. Su PDF no está disponible. |
| não encontrado (formulário) | SIN RESULTADO · No encontramos un certificado con esos datos · Revise el N° de registro y el RUT del alumno tal como aparecen en el certificado. · También puede escanear el código QR del certificado. |
| não encontrado (QR) | SIN RESULTADO · No encontramos este certificado · Revise que el código QR escaneado sea el del certificado. |
| espera (≤ 60 s) | ESPERE · Demasiadas consultas seguidas · Intente de nuevo en N segundos. |
| bloqueio (> 60 s) | BLOQUEADO · La consulta por N° de registro y RUT está bloqueada · Hubo demasiados intentos sin resultado. Podrá intentar de nuevo en N minutos. · Mientras tanto, escanee el código QR del certificado: esa validación no tiene este bloqueo. |
| erro de formato | Formato: LOT-2026-123 · RUT inválido |
| rede ou 500 | No pudimos validar el certificado ahora. Intente más tarde. |
| botão do PDF | DESCARGAR PDF |
| falha do PDF | No pudimos descargar el PDF ahora. Intente más tarde. |

Os textos "não encontrado (QR)", "falha do PDF", o de D16 e o estado "Validando…" não estavam nos
mockups: são minha proposta, no mesmo tom. O bloqueio arredonda os minutos para cima.

**Formulário.**

- `codigo`: aparado e em maiúsculas antes de conferir e de enviar; aceito se casar
  `^LOT-\d{4}-\d{1,9}$` e tiver até 20 caracteres (`K1`).
- `rut`: aparado; aceito se tiver até 20 caracteres e o dígito verificador certo (módulo 11, `K`
  minúsculo ou maiúsculo, com ou sem pontos e hífen). Enviado como digitado, aparado: a API
  normaliza.
- Erro de formato aparece no campo, associado por `aria-describedby`, e o envio não sai.
- Enquanto a consulta corre, o botão mostra "Validando…" e fica desativado.
- Um 422 da API (formato que passou no cliente e falhou no servidor) mostra o erro de formato nos
  campos que vierem em `errors`; sem `errors`, nos dois.
- O resultado entra numa região `aria-live="polite"`, e o foco vai para o título do cartão.
- **No bloqueio (> 60 s) o formulário continua usável** (`Claude`). A página não sabe se o 429 veio
  do limite de falhas do IP ou do RUT, e no segundo caso outro certificado, com outro RUT, ainda
  passa: quem confere vários trabalhadores seguidos não pode ficar travado por um RUT. Os minutos
  ficam fixos, calculados quando o 429 chega, e a mensagem some no envio seguinte. Só a espera de
  ≤ 60 s desativa o botão, com contagem.

**Modo QR.** Ao abrir, a página faz o `GET /{uuid}` e mostra "Validando…" até a resposta. 404 é o
cartão "não encontrado (QR)". 429 aqui é sempre espera, qualquer que seja o valor (o QR não passa
pelo limite de falhas).

**PDF.** `GET /{uuid}/pdf` com `fetch`. 200: o corpo vira `blob`, o nome sai do `filename=` do
`Content-Disposition` (fallback `certificado-<codigo>.pdf`) e um `<a download>` temporário dispara o
download; a URL de objeto é revogada depois. 410: o cartão passa ao estado revogado. 429: a espera
aparece junto do botão. 404, rede ou 500: "falha do PDF".

### 5.5 Integração

`src/integrations/certificados/` expõe três chamadas — consulta por uuid, consulta por código + RUT e
PDF — que devolvem uma união discriminada, nunca exceção para o componente: certificado; não
encontrado; formato inválido (com os campos); espera (segundos ou nenhum); bloqueio (segundos);
revogado (só o PDF); PDF (blob + nome); falha. A classificação do 429 em espera ou bloqueio pelo
`Retry-After` (≤ 60 / > 60) vive na integração.

- Todo `fetch` sai com `credentials: 'omit'`, `Accept: application/json` (ou
  `application/pdf`) e só os headers que o preflight da API aceita (`Content-Type`, `Accept`,
  `Accept-Language` — `K6`).
- A resposta 200 é validada por um schema `zod` do `PublicCertificateData` (`K3`); resposta que não
  bate vira falha, nunca cartão com campo vazio.
- Nada é gravado em armazenamento do navegador. Nada é logado com o RUT.

O dígito verificador do RUT e o formato do código são funções puras em `src/lib/`. O formatador de
data (D17) também.

### 5.6 Deploy e rollback

Em `.github/workflows/ci.yml`, nos dois pares de `sync` (release e raiz), `validar/index.html` é
tratado como `index.html`: fora do `immutable`, dentro do `no-cache`. A invalidação passa a
`/index.html /validar/index.html /robots.txt /sitemap.xml`. O trecho de rollback da `ADR-SITE-004`
(linhas 156, 161 e 165) recebe a mesma mudança, com uma nota de atualização datada. Os padrões do
`aws s3 sync` casam com o caminho relativo inteiro, então `--exclude "index.html"` não pega
`validar/index.html`: a correção é nomear os dois arquivos, não trocar por curinga que pegue HTML
futuro sem decisão.

### 5.7 Header

`site.nav` ganha `{ label: 'Validar Certificado', href: '/validar' }` e as âncoras de D7. O Header e
o `MobileMenu` recebem a página atual por prop, para pôr `aria-current="page"` e o estilo de D2. O
item novo precisa caber no desktop a partir de `--breakpoint-desktop` (1000 px) sem quebrar linha
nem encostar no logo; se não couber, o executor para e traz a medida, não reduz fonte nem gap por
conta própria.

### 5.8 Tokens

Cores de estado novas no `@theme` de `src/index.css`, com nome semântico (ex. `--color-status-ok`,
`--color-status-warn`), texto branco sobre elas com contraste ≥ 4,5:1, e o vermelho reaproveitando
`--color-danger`. O executor mede o contraste e registra o valor no comentário do token.

## 6. Sequência de execução

1. **ADR e rules.** `ADR-SITE-007`; nota de atualização na `ADR-SITE-004` apontando para ela; linha
   do router em `.claude/rules/architecture.md`; termos novos em `CONTEXT.md` se a página introduzir
   vocabulário de domínio (consulta, validação pelo QR).
2. **Borda e CSP.** Função (D12, §5.1), CSP (§5.2), comentário de D18, catracas.
3. **Build.** Segunda entrada, `appType: 'mpa'`, plugin e tabela de casos (D11, §5.3).
4. **Deploy e rollback.** §5.6.
5. **Funções puras.** RUT, código e datas, com Vitest.
6. **Integração.** §5.5, com Vitest sobre `fetch` simulado.
7. **Página.** Componentes, conteúdo, tokens e composição (§5.4, §5.8).
8. **Header.** §5.7 e regravação dos snapshots de regressão visual.
9. **E2E.** §8.
10. **Prova local contra o stack do Lotus** (§8, A7), com João.

A ordem 2 → 3 → 7 → 9 é dependência real; 1, 4, 5 e 8 podem andar antes ou entre elas.

## 7. Commits

Um commit por task, Conventional Commits com o work item no escopo (`feat(validacao-certificado): …`,
`ci(validacao-certificado): …`, `docs(validacao-certificado): …`). A transição de estado que
acompanha a entrega de uma task entra no commit dessa task (CLAUDE.md §4).

## 8. Prova de aceite

O critério específico vem antes dos gates genéricos.

- **A1 · Borda.** A tabela de casos de §5.1 passa contra a função do template em `node:vm` e contra
  o plugin; o ramo de `www` continua passando, inclusive para `/validar/<uuid>`.
- **A2 · CSP.** `cabecalhos.test.mjs` verde com `https://app.lotusotec.cl` no `connect-src`; o projeto
  `producao` do E2E abre `/` e `/validar/<uuid>` sob a CSP real do preview com zero violação.
- **A3 · E2E da validação** (`pnpm e2e`, API simulada por `page.route` em
  `https://app.lotusotec.cl`, com os headers CORS que a API real manda — `Access-Control-Allow-Origin`
  e `Access-Control-Expose-Headers: Content-Disposition, Retry-After` —, para a página ler os dois
  headers como em produção):
  - QR: vigente, por vencer, vencido, revogado, não encontrado, espera;
  - formulário: 200 com cartão, não encontrado, 422 do servidor, formato inválido no cliente sem
    pedido de rede, espera ≤ 60 com contagem e botão desativado, bloqueio > 60 com a orientação do QR,
    rede/500;
  - PDF: 200 com o nome do `Content-Disposition`, 410 levando ao estado revogado;
  - o RUT não aparece em nenhuma URL pedida nem na URL da página;
  - todo pedido à API sai sem cookie (`credentials: 'omit'`);
  - nos quatro motores (D15).
- **A4 · Caminhos.** No preview: `/validar` e `/validar/<uuid>` → 200 com a página; `/validar/abc`,
  `/validar/<uuid>/x` e `/inventado` → 404.
- **A5 · Home.** Do `/validar`, os itens Quienes Somos, Cursos e Contacto levam à home na seção
  certa; na home, rolam sem recarregar; o item novo aparece no desktop e no mobile. Esses casos
  rodam nos quatro motores, junto do fluxo de validação (D15). Os snapshots de regressão visual são
  regravados, e a diferença fica no menu.
- **A6 · Acessibilidade e SEO.** `a11y.spec.ts` cobre `/validar` (formulário e cartão) sem violação
  nova; `/validar` tem `noindex` e não está no sitemap.
- **A7 · Stack local do Lotus**, com João (o `LOT-2026-9001` da lane provavelmente sumiu — packet,
  Open question 4 —, então João cria um certificado de demonstração no stack principal):
  - `CORS_PUBLIC_ORIGINS=http://localhost:5190` no `backend/.env` do Lotus;
  - `VITE_CERTIFICADOS_API_URL=http://localhost:8080 pnpm dev --port 5190 --strictPort` (a 5173 é a
    do app do Lotus e cairia na política CORS do app, `K6`);
  - provar: QR de um certificado válido, código + RUT certos, RUT errado (404), formato inválido, PDF
    baixado com o nome certo, 11 consultas no mesmo minuto (espera) e, se der, 21 falhas na hora
    (bloqueio com o QR). Revogado, se houver um no stack.
  - registro em `docs/infra/evidencia-validacao-certificado-<data>.md`, com o que foi visto.
- **A8 · Produção, depois de D13** (pendência pós-merge, §10): `GET /consulta` → 405; preflight com
  `Origin: https://lotusotec.cl` devolvendo esse `Allow-Origin` sem `Allow-Credentials`; um uuid
  real aberto em `https://lotusotec.cl/validar/<uuid>`; `/validar/abc` → 404. Os itens de caminho e
  CSP entram no smoke de produção (`e2e/smoke/`).
- **Gates:** `pnpm check` e `pnpm e2e` verdes no HEAD; `check` do corporativo na árvore filtrada
  (memória "Reproduzir o CI corporativo") porque o bloco mexe em `ci.yml`.

## 9. Rollback do próprio bloco

- **Site:** o rollback da `ADR-SITE-004`, já com `validar/index.html` (§5.6). Voltar a um release
  anterior tira a página e o item do menu juntos.
- **Borda:** reaplicar o template anterior. A reescrita e o `connect-src` saem juntos; sem a página,
  a reescrita sozinha só produz 404.
- Nenhum dado é escrito em lugar nenhum, então não há o que desfazer além disso.

## 10. Documentos, débitos e backlog

- `docs/adr/ADR-SITE-007.md` (novo) e nota na `ADR-SITE-004`.
- `.claude/rules/architecture.md`: a linha do router.
- `.env.example` e `src/vite-env.d.ts`: `VITE_CERTIFICADOS_API_URL`.
- `docs/infra/runbook-aws.md`: se ele descreve o deploy ou o rollback com `index.html` por nome, a
  mesma mudança de §5.6.
- Fechamento: bloco novo em `BLOCOS` do backlog; o corpo do PR diz que ele só é mesclado depois de
  D13 passo 1; pendência "prova em produção da validação" com gatilho D13 passo 1; pendência "link de contato na validação" com gatilho no aceite da D-70 do
  Lotus; aviso à sessão do Lotus de que a página está pronta para a ficha 63 depois de A8.
- Notion: o item não tem EAP e nada é escrito lá.

## 11. Riscos

| Risco | Efeito | Contenção |
|---|---|---|
| Site publicado antes da API em produção | menu leva a página que só mostra erro | D13 |
| `validar/index.html` com cache `immutable` | deploy seguinte não chega a quem já abriu a página | §5.6; A8 confere o `Cache-Control` |
| Reescrita larga demais | caminho inventado responde 200 | tabela de casos (A1) e A4 |
| Dev/preview divergindo da borda | E2E verde com produção quebrada | tabela única contra os dois (D11) |
| Item novo não cabe no header em 1000 px | menu quebra linha | §5.7: parar e medir |
| Página indexada com nome de aluno | dado pessoal no buscador | D9 |
| Contrato da API mudar no Lotus | página lê campo errado | schema `zod` rejeita; gatilhos do packet |
| Snapshot visual regravado esconder regressão | diferença fora do menu passa | A5: a diferença tem de ficar no menu |

## 12. Deixado ao executor

- nomes de arquivos, pastas e componentes dentro das regras de direção de `eslint.config.js`;
- a forma exata do plugin do Vite e onde mora a tabela de casos;
- a forma do schema `zod` e da união discriminada;
- como o teste confere os padrões do `ci.yml` (catraca lendo o YAML, se houver leitor; senão, prova
  registrada);
- o tom exato dos textos marcados como proposta em §5.4, sem mudar o sentido.
