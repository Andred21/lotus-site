// Os cabeçalhos que a borda emite em toda resposta (`7.2.2`).
//
// Este módulo é a fonte canônica: `vite.config.ts` serve `CABECALHOS` no
// preview, e a catraca `scripts/infra/cabecalhos.test.mjs` reprova qualquer
// divergência entre o template e daqui — o CloudFormation não lê arquivo
// externo, então o YAML é cópia vigiada (spec §4.2 de
// `docs/superpowers/specs/2026-09-27-7.2.2-headers-hardening-design.md`).
//
// O leitor da `PoliticaDeCabecalhos` de `infra/lotus-site.yaml` mora em
// `politica-de-cabecalhos.mjs`, fora deste arquivo: `vite.config.ts` e o E2E
// importam daqui e não devem puxar o leitor de template para o grafo do
// build.

// A CSP mora aqui como lista de diretivas; no YAML ela é a string final, numa
// linha só. `default-src 'none'` obriga a enumerar tudo o que o site carrega:
// recurso novo não previsto reprova no E2E em vez de passar calado.
// `challenges.cloudflare.com` em `script-src` e `frame-src` é o Turnstile
// (spec D5). Sem `upgrade-insecure-requests`: o preview roda em
// `http://localhost` (spec D10).
const DIRETIVAS_CSP = Object.freeze([
  "default-src 'none'",
  "script-src 'self' https://challenges.cloudflare.com",
  'frame-src https://challenges.cloudflare.com',
  "connect-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
])

/**
 * Tudo o que a borda emite. O `X-Robots-Tag: noindex, nofollow` saiu daqui e
 * do template juntos no dia do corte (7.2.5, spec D5): com o domínio do
 * cliente apontando para a distribuição, o site precisa ser indexável.
 * HSTS de um ano sem `includeSubDomains` e sem `preload`: `mail.lotusotec.cl`
 * falha verificação TLS e `app.lotusotec.cl` não responde em 443 (spec D1).
 * @type {Readonly<Record<string, string>>}
 */
export const CABECALHOS = Object.freeze({
  'Content-Security-Policy': DIRETIVAS_CSP.join('; '),
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
})

/**
 * O que a borda tira da resposta da origin. Remover `Server` faz o
 * CloudFront responder o próprio `Server: CloudFront` (spec D7).
 * @type {readonly string[]}
 */
export const REMOVIDOS = Object.freeze([
  'Server',
  'x-amz-server-side-encryption',
  'x-amz-version-id',
])
