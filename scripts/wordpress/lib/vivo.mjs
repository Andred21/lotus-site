// O WordPress vivo para o ensaio de restauração (7.2.7, spec D9). Desde o
// corte (B5), lotusotec.cl resolve para a distribuição, que serve o clone; o
// WordPress só responde no IP dele, até o estágio 2 de B7 esvaziar o host.
//
// Não importa de scripts/inventario/: o espelho não leva aquele diretório
// (.espelho-exclusoes), e este arquivo atravessa — o import quebraria o
// `tsc -b` e o Vitest do corporativo (D-62).
import https from 'node:https'

export const WORDPRESS_IP = '185.146.167.195'

/** Regra do Chromium que manda o domínio e o `www` para o WordPress. */
export const PARA_VIVO = `MAP lotusotec.cl ${WORDPRESS_IP}, MAP www.lotusotec.cl ${WORDPRESS_IP}`

/**
 * `lookup` que responde sempre `ip`. `options.all` cobre o autoSelectFamily
 * do Node ≥ 20, que pede a lista inteira; sem esse ramo a conexão nunca sai
 * (mesma forma de `e2e/smoke/rede.ts`).
 * @param {string} ip
 * @returns {NonNullable<import('node:https').RequestOptions['lookup']>}
 */
export function forcar(ip) {
  return (_hostname, options, callback) => {
    if (options.all) callback(null, [{ address: ip, family: 4 }])
    else callback(null, ip, 4)
  }
}

/**
 * Reprova a leitura do vivo que não veio do WordPress: resposta da
 * CloudFront, que é o clone, ou status diferente de 200 — depois do estágio
 * 2 de B7 o host responde 403 e não há mais vivo para comparar.
 * @param {number} status
 * @param {Record<string, string>} headers nomes em minúsculas
 */
export function exigirVivo(status, headers) {
  // A mesma guarda de `exigirWordPress`, em scripts/inventario/lib/site.mjs.
  const origem = `${headers['server'] ?? ''} ${headers['via'] ?? ''}`
  if (/cloudfront/i.test(origem)) {
    throw new Error(
      `a referência não é o WordPress: a resposta veio da CloudFront (server: ${headers['server'] ?? '—'})`,
    )
  }
  if (status !== 200) {
    throw new Error(
      `o WordPress vivo respondeu ${status} em ${WORDPRESS_IP}: depois de B7 (7.2.7) não há vivo para comparar`,
    )
  }
}

/**
 * Status de um GET anônimo ao WordPress pelo IP, sem seguir redirect — a
 * resposta que falhou na cópia também era de um salto só. Nunca outro
 * método: o ensaio não manda POST para produção.
 * @param {string} url
 * @returns {Promise<number>}
 */
export function statusNoVivo(url) {
  const alvo = new URL(url)
  return new Promise((resolve, reject) => {
    const pedido = https.request(
      {
        hostname: alvo.hostname,
        port: 443,
        path: `${alvo.pathname}${alvo.search}`,
        method: 'GET',
        lookup: forcar(WORDPRESS_IP),
        servername: alvo.hostname,
      },
      (resposta) => {
        resposta.resume()
        resolve(resposta.statusCode ?? 0)
      },
    )
    pedido.on('error', reject)
    pedido.end()
  })
}
