# Evidência — cabeçalhos de segurança na distribuição (`7.2.2`)

Medido em 2026-09-28, distribuição `dhpoztt69jydz.cloudfront.net`, stack `lotus-site` (sa-east-1),
atualização iniciada em `2026-09-28T03:00:57Z` (`LastUpdatedTime` de `aws cloudformation
describe-stacks --stack-name lotus-site`) e concluída em `2026-09-28T03:01:12Z` (evento
`UPDATE_COMPLETE` do stack em `describe-stack-events`), após o change set
`arn:aws:cloudformation:sa-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1790564379/b58c6973-dd47-485a-9422-afb989ac8487`
(`CreationTime 2026-09-28T02:59:40Z`, `ExecutionStatus EXECUTE_COMPLETE`) executado por João.

## curl -sI

### /

```text
HTTP/2 200
server: CloudFront
content-type: text/html
content-length: 2785
accept-ranges: bytes
last-modified: Mon, 28 Sep 2026 01:09:54 GMT
date: Mon, 28 Sep 2026 03:02:42 GMT
cache-control: no-cache
etag: "b710d49ef34b9164adce177b90b9509b"
x-cache: RefreshHit from cloudfront
via: 1.1 734a6c43e6f60be0898e8a6002667bf0.cloudfront.net (CloudFront)
x-amz-cf-pop: MIA50-P3
alt-svc: h3=":443"; ma=86400
x-amz-cf-id: TB71qFfjaSyD5sJfLoU5Ya2Ji1Y2CmmEHw4nXNG63ZMPYgZ_uB2Eug==
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
content-security-policy: default-src 'none'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'; frame-ancestors 'none'
x-content-type-options: nosniff
strict-transport-security: max-age=31536000
permissions-policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
x-robots-tag: noindex, nofollow
```

Asset real usado no próximo passo, obtido de `curl -s https://dhpoztt69jydz.cloudfront.net/ | grep
-o '/assets/[^"]*\.js'`: `/assets/index-WBMd0hPu.js`.

### /assets/index-WBMd0hPu.js

```text
HTTP/2 200
server: CloudFront
content-type: text/javascript
content-length: 297262
date: Mon, 28 Sep 2026 01:30:53 GMT
last-modified: Mon, 28 Sep 2026 01:09:51 GMT
etag: "7c857d3ba2edbb03ed5ca1d28a5a7224"
cache-control: public, max-age=31536000, immutable
accept-ranges: bytes
x-cache: Hit from cloudfront
via: 1.1 a2ee0ac8c3d18c49e82324dc52d3710c.cloudfront.net (CloudFront)
x-amz-cf-pop: MIA50-P3
alt-svc: h3=":443"; ma=86400
x-amz-cf-id: lrvy1qj0WzoDqeGjQSRARRodHujR_i2O4YJfi6WViRCTOQjnSm908g==
age: 5514
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
content-security-policy: default-src 'none'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'; frame-ancestors 'none'
x-content-type-options: nosniff
strict-transport-security: max-age=31536000
permissions-policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
x-robots-tag: noindex, nofollow
```

### /api/contacto

```text
HTTP/2 405
server: CloudFront
content-type: application/json
content-length: 0
date: Mon, 28 Sep 2026 03:02:48 GMT
x-amzn-trace-id: Root=1-6ab9d8d7-157319654e10a57d1605c282;Parent=422ea3d3e21d9a2e;Sampled=0;Lineage=1:750537c6:0
x-amzn-requestid: 96fd2c70-6984-497a-ad3d-17afe3c6d96b
x-cache: Error from cloudfront
via: 1.1 289b41e40583cbb9981c79d07b0262ce.cloudfront.net (CloudFront)
x-amz-cf-pop: MIA50-P3
alt-svc: h3=":443"; ma=86400
x-amz-cf-id: 3BxzAhY2Hv3WCrw_FNhA_bPviT-woMXCIeW70qenJeNhYH15cjp9MQ==
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
content-security-policy: default-src 'none'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'; frame-ancestors 'none'
x-content-type-options: nosniff
strict-transport-security: max-age=31536000
permissions-policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
x-robots-tag: noindex, nofollow
```

`GET /api/contacto` devolve `405` (a função só aceita `POST`), não `404`; a política de cabeçalhos
se aplica do mesmo jeito, o que é o que este passo prova.

### /caminho-que-nao-existe-7222 (404)

```text
HTTP/2 404
server: CloudFront
content-type: application/xml
date: Mon, 28 Sep 2026 03:02:48 GMT
x-cache: Error from cloudfront
via: 1.1 6ae3c60d8a1e4fba1ffac3aabbbdfcca.cloudfront.net (CloudFront)
x-amz-cf-pop: MIA50-P3
alt-svc: h3=":443"; ma=86400
x-amz-cf-id: 4Yt8AWn4cWTRNUyaqw9MQ8fLI-D7qx9U9c2i7MgZDFTaQyiYM_xGMQ==
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
content-security-policy: default-src 'none'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'; frame-ancestors 'none'
x-content-type-options: nosniff
strict-transport-security: max-age=31536000
permissions-policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
x-robots-tag: noindex, nofollow
```

Os sete cabeçalhos de `scripts/infra/lib/cabecalhos.mjs` (`CABECALHOS`) estão presentes e com o
valor exato do módulo nas quatro respostas, inclusive nas duas de erro (`405` e `404`): o
CloudFront aplica a `ResponseHeadersPolicy` mesmo quando a origem responde erro. `x-amz-version-id`
e `x-amz-server-side-encryption` (`REMOVIDOS`) não aparecem em nenhuma resposta; os únicos campos
`x-amz*` presentes são `x-amz-cf-id`, `x-amz-cf-pop` e (em `/api/contacto`) `x-amzn-trace-id` /
`x-amzn-requestid`, que são do próprio CloudFront/Lambda e não os dois nomes que a política remove.
`Server: CloudFront` em todas — o CloudFront repõe o próprio ao remover o do S3, como esperado.

HSTS servido como `max-age=31536000`, sem `includeSubDomains` nem `preload` — igual, caractere por
caractere, ao valor de `CABECALHOS['Strict-Transport-Security']` no módulo e ao que
`infra/lotus-site.yaml` declara (`IncludeSubdomains: false`, `Preload: false`); não há divergência
de formatação entre o preview e a borda para registrar aqui.

## Chromium real, Turnstile verdadeiro

Remedido em 2026-09-28 com um script corrigido (mesma estrutura da Task 7 do plano, script
descartável no scratchpad, não commitado). O desvio em relação ao script original do brief:
`waitForSelector('iframe[src*="challenges.cloudflare.com"]')` nunca bate, porque o Turnstile
renderiza o próprio iframe dentro de um **shadow root fechado** — não aparece em
`document.querySelectorAll('iframe')` nem em nenhum seletor de DOM. `page.frames()` do Playwright
enxerga o frame do mesmo jeito, porque acompanha a árvore de frames do processo de render, não o
DOM; o script corrigido espera o evento `framenavigated` do Playwright com um predicado na URL do
`challenge-platform` (o `frameattached` dispara cedo demais, antes da navegação para a URL real, e
não bate no predicado), com timeout de 30 s, e também verifica os seletores de DOM que sobrevivem
ao shadow root (`input[name="cf-turnstile-response"]` e `[id^="cf-chl-widget-"]`, que ficam fora do
shadow root). Cada violação é registrada como
`${violatedDirective}: ${blockedURI} @ ${sourceFile}`, e os erros de console são separados por
origem (`msg.location().url`): página do site vs. `challenges.cloudflare.com` vs. outros.

Saída real, duas execuções seguidas (sem preencher nem enviar o formulário — só rolagem até
`#Contacto`):

```json
{
  "frameDoTurnstileEncontrado": "https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/f/av0/rch/q3wk4/0x4AAAAAAFErz6_Md-YOkwY-/auto/fbE/new/normal?lang=auto",
  "erroDeEspera": null,
  "framesTotais": [
    "https://dhpoztt69jydz.cloudfront.net/",
    "https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/f/av0/rch/q3wk4/0x4AAAAAAFErz6_Md-YOkwY-/auto/fbE/new/normal?lang=auto"
  ],
  "iframesNoDom": 0,
  "seletoresDeInput": {
    "input[name=\"cf-turnstile-response\"]": true,
    "[id^=\"cf-chl-widget-\"]": true
  },
  "violacoes": [
    "script-src: eval @ https://dhpoztt69jydz.cloudfront.net/assets/index-WBMd0hPu.js"
  ],
  "errosDeConsolePorOrigem": {
    "topo": [],
    "challengesCloudflare": [
      "https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/f/av0/rch/q3wk4/0x4AAAAAAFErz6_Md-YOkwY-/auto/fbE/new/normal?lang=auto: %c%d font-size:0;color:transparent NaN",
      "https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/f/av0/rch/q3wk4/0x4AAAAAAFErz6_Md-YOkwY-/auto/fbE/new/normal?lang=auto: %c%d font-size:0;color:transparent NaN"
    ],
    "outros": []
  }
}
```

A segunda execução repetiu exatamente o mesmo formato (com um id de sessão do challenge diferente
na URL, esperado), confirmando reprodutibilidade.

Leitura direta do JSON:

- **O Turnstile carrega.** `frameDoTurnstileEncontrado` traz a URL real do
  `challenge-platform/h/b/turnstile/...`, e os dois seletores que sobrevivem ao shadow root
  (`input[name="cf-turnstile-response"]` e `[id^="cf-chl-widget-"]`) existem no DOM. `iframesNoDom:
0` confere com o shadow fechado — não é ausência do widget, é o widget escondido do
  `querySelectorAll`.
- **Nenhuma violação de CSP contra origens da Cloudflare.** A única entrada de `violacoes` é
  `script-src: eval`, com `sourceFile` apontando para o próprio bundle do site
  (`assets/index-WBMd0hPu.js`), não para `challenges.cloudflare.com`. `frame-src`/`connect-src`
  para a Cloudflare não aparecem violados em nenhuma execução.
- **A única violação é a sonda do zod, tolerada por decisão (`D-62`).** Dispara à carga da página
  (sem preencher nem enviar o formulário), porque `contactSchema = z.object({...})` em
  `src/lib/contact-schema.ts` é construído no topo do módulo — o gatilho é a leitura de
  `allowsEval.value` no construtor `$ZodObjectJIT`
  (`node_modules/zod/v4/core/schemas.js:971-972`), que executa a sonda de capacidade
  `new Function("")` (`node_modules/zod/v4/core/util.js:145-163`). Corrigido o texto de `D-62` e o
  comentário de `SONDA_DO_ZOD` em `e2e/cabecalhos.spec.ts` nesta mesma data (commit
  `bf394b3fecb62daf482eb406672ba6f845d7c81d`) para refletir esse gatilho; a decisão de tolerância é
  de João, 2026-09-27, e continua valendo.
- **Console da página do site: zero erros.** `errosDeConsolePorOrigem.topo` está vazio nas duas
  execuções — o esperado.
- **Ruído dentro dos frames da Cloudflare, descrito como tal.** As duas linhas em
  `challengesCloudflare` (`%c%d font-size:0;color:transparent NaN`) são telemetria/ofuscação que o
  próprio widget do Turnstile emite dentro do seu frame — não são erro de aplicação nem violação de
  CSP. Em execuções anteriores desta mesma investigação também apareceram, dentro dos frames da
  Cloudflare, o aviso `No available adapters.` e uma falha de rede
  `net::ERR_NAME_NOT_RESOLVED` para `brunhild.challenges.cloudflare.com` — fingerprinting
  anti-bot da própria Cloudflare rodando dentro do seu frame, não CSP do site; nesta remedição elas
  não voltaram a aparecer nas duas execuções coladas acima, o que é consistente com serem
  intermitentes e dependentes do desafio específico servido a cada carregamento.

Resultado: frame do Turnstile carregado, zero violação contra origem da Cloudflare, zero erro de
console na página do site e uma única violação, a sonda do zod tolerada pelo `D-62`.

## Exceção ratificada: console dentro do frame da Cloudflare

A spec §7 pede zero erro de console. As duas linhas `%c%d font-size:0;color:transparent NaN` saem
de dentro do frame do Turnstile (`challenges.cloudflare.com`), código de terceiro fora do controle
do site. João decidiu em 2026-09-28, na review de `7.2.2`: o critério "zero erro de console" vale
para a página do site (`errosDeConsolePorOrigem.topo`, vazio), e o ruído dentro dos frames da
Cloudflare fica registrado aqui como exceção nominal.

## Limites declarados (spec §7)

- O envio real do formulário não entra na automação: o Turnstile real tende a recusar navegador
  automatizado, e `B2` já provou a entrega ponta a ponta. O `connect-src` do envio fica provado
  pelo E2E sob a mesma CSP.
- A prova de CSP é em Chromium. Firefox e WebKit rodam o fluxo principal contra o dev server, sem
  CSP.
