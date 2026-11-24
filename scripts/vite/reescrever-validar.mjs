// Plugin de dev e preview: reproduz a reescrita que a borda faz (D11 da spec,
// ADR-SITE-007) para `/validar`, `/validar/` e `/validar/<uuid>` servirem
// `validar/index.html`. A tabela de casos mora em
// `scripts/infra/lib/validar.mjs`; o teste lê dela.
import { DESTINO_DA_VALIDACAO } from '../infra/lib/validar.mjs'

// A mesma expressão da função `RedirecionarWww` em `infra/lotus-site.yaml`.
const UUID =
  /^\/validar\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * O handler mora fora do plugin para o teste poder chamá-lo sem depender do
 * tipo `Plugin` do Vite.
 * @param {string} url `req.url`: caminho mais query.
 * @returns {string} o mesmo texto, ou o destino seguido da query original.
 */
export function reescreverCaminho(url) {
  const corte = url.indexOf('?')
  const caminho = corte === -1 ? url : url.slice(0, corte)
  const query = corte === -1 ? '' : url.slice(corte)
  if (
    caminho === '/validar' ||
    caminho === '/validar/' ||
    caminho === DESTINO_DA_VALIDACAO ||
    UUID.test(caminho)
  ) {
    return DESTINO_DA_VALIDACAO + query
  }
  return url
}

/**
 * @typedef {{ middlewares: { use: (fn: (req: { url?: string }, res: unknown, next: () => void) => void) => unknown } }} Servidor
 */

/** @param {Servidor} servidor */
function registrar(servidor) {
  // Direto, sem devolver função: roda antes do middleware de arquivos
  // estáticos e do redirecionamento de `/validar` para `/validar/`.
  servidor.middlewares.use((req, _res, next) => {
    if (req.url) req.url = reescreverCaminho(req.url)
    next()
  })
}

export function reescreverValidar() {
  return {
    name: 'lotus-reescrever-validar',
    configureServer: registrar,
    configurePreviewServer: registrar,
  }
}
