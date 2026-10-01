import { createHash } from 'node:crypto'
import http from 'node:http'
import https from 'node:https'
import tls from 'node:tls'

// Lado Node do smoke: requisições cruas (sem seguir redirect, sem cache) e
// o certificado, todas com a resolução forçada para `ip` e o SNI/Host do
// URL pedido. `node:net` não exporta o tipo do `lookup`; ele é lido daqui.
type Lookup = NonNullable<https.RequestOptions['lookup']>

export type Resposta = {
  status: number
  headers: http.IncomingHttpHeaders
  corpo: Buffer
}

// `options.all` cobre o autoSelectFamily do Node ≥ 20, que pede a lista
// inteira; sem esse ramo a conexão nunca sai.
export function forcar(ip: string): Lookup {
  return (_hostname, options, callback) => {
    if (options.all) callback(null, [{ address: ip, family: 4 }])
    else callback(null, ip, 4)
  }
}

export function sha256(dados: Buffer | string): string {
  return createHash('sha256').update(dados).digest('hex')
}

export function pedir(
  ip: string,
  url: string | URL,
  init: {
    method?: string
    headers?: Record<string, string>
    corpo?: string
  } = {},
): Promise<Resposta> {
  const alvo = new URL(url)
  const seguro = alvo.protocol === 'https:'
  const modulo = seguro ? https : http
  return new Promise((resolve, reject) => {
    const pedido = modulo.request(
      {
        hostname: alvo.hostname,
        port: alvo.port || (seguro ? 443 : 80),
        path: `${alvo.pathname}${alvo.search}`,
        method: init.method ?? 'GET',
        headers: init.headers,
        lookup: forcar(ip),
        servername: alvo.hostname,
      },
      (resposta) => {
        const partes: Buffer[] = []
        resposta.on('data', (parte: Buffer) => partes.push(parte))
        resposta.on('end', () =>
          resolve({
            status: resposta.statusCode ?? 0,
            headers: resposta.headers,
            corpo: Buffer.concat(partes),
          }),
        )
      },
    )
    pedido.on('error', reject)
    if (init.corpo !== undefined) pedido.write(init.corpo)
    pedido.end()
  })
}

export function certificadoDe(
  ip: string,
  nome: string,
): Promise<{
  protocolo: string
  emissor: string
  sans: string
  validoAte: Date
}> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host: nome, port: 443, servername: nome, lookup: forcar(ip) },
      () => {
        const certificado = socket.getPeerCertificate()
        const protocolo = socket.getProtocol() ?? ''
        socket.end()
        resolve({
          protocolo,
          // `issuer.O` é string, lista (várias O) ou ausente nos tipos do Node.
          emissor: String(certificado.issuer.O ?? ''),
          sans: certificado.subjectaltname ?? '',
          validoAte: new Date(certificado.valid_to),
        })
      },
    )
    socket.on('error', reject)
  })
}

// O adapter do site manda o hash do corpo exato (src/integrations/contact/
// api-contacto.ts): sem ele o OAC recusa o POST antes de chegar à função.
export function cabecalhosDePost(corpo: string): Record<string, string> {
  return {
    'content-type': 'application/json',
    accept: 'application/json',
    'x-amz-content-sha256': sha256(corpo),
  }
}
