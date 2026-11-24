import type { Page } from '@playwright/test'

// API pública de certificados do Lotus simulada por `page.route` (A3). A URL
// é a de produção: o E2E não define `VITE_CERTIFICADOS_API_URL`, e a CSP do
// preview só abre `connect-src` para esta origem.
export const API_CERTIFICADOS =
  'https://app.lotusotec.cl/api/publico/certificados/**'

export const UUID = '0f8fad5b-d9cb-469f-a165-70867728950e'

// Payloads como a API manda (K3): com `cliente` e `redator`, que o schema
// descarta (P16), e sem RUT em campo nenhum.
export const VIGENTE = {
  codigo: 'LOT-2026-144',
  status: 'emitido',
  valido_ate: '2028-08-12',
  revoked_at: null,
  aluno: { name: 'María Fernanda Rojas' },
  curso: {
    name: 'Especialistas Líneas Vivas en Media Tensión',
    workload_hours: 40,
  },
  turma: { end_date: '2026-08-12' },
  cliente: { name: 'Empresa Eléctrica del Sur' },
  redator: { name: 'Equipo Lotus' },
  display_status: 'vigente',
}

export const POR_VENCER = { ...VIGENTE, display_status: 'por_vencer' }

export const VENCIDO = {
  ...VIGENTE,
  valido_ate: '2026-03-03',
  display_status: 'vencido',
}

// Microssegundos, como o Carbon do Lotus serializa (P10).
export const REVOGADO = {
  ...VIGENTE,
  status: 'revocado',
  revoked_at: '2026-10-05T14:30:00.000000Z',
  display_status: 'revocado',
}

/** A consulta por código devolve também o `uuid`, para o PDF (K3). */
export const CONSULTA_VIGENTE = { ...VIGENTE, uuid: UUID }

// Diferente do nome padrão do adapter (`certificado-${codigo}.pdf`): o teste
// do download só passa se a página leu o `Content-Disposition` (A3).
export const NOME_DO_PDF = 'certificado-LOT-2026-144-emitido.pdf'

export type RespostaFalsa = {
  status: number
  corpo?: unknown
  headers?: Record<string, string>
}

export type PedidoCapturado = {
  tipo: 'uuid' | 'consulta' | 'pdf'
  method: string
  url: string
  corpo: string
  cookie?: string
}

type Tipo = PedidoCapturado['tipo']

function tipoDo(url: string): Tipo {
  const { pathname } = new URL(url)
  if (pathname.endsWith('/consulta')) return 'consulta'
  if (pathname.endsWith('/pdf')) return 'pdf'
  return 'uuid'
}

/**
 * Intercepta a API de certificados. Cada tipo recebe uma resposta ou uma
 * lista consumida em ordem, em que a última se repete. O preflight `OPTIONS`
 * responde 204 sem ser capturado; os outros pedidos são guardados em
 * `capturados`, com o `cookie` que de fato saiu. Toda resposta traz os
 * headers CORS que a API real manda, para a página ler `Content-Disposition`
 * e `Retry-After` como em produção. Tipo sem resposta configurada aborta,
 * como uma falha de rede.
 */
export async function fingirApiCertificados(
  page: Page,
  respostas: Partial<Record<Tipo, RespostaFalsa | RespostaFalsa[]>>,
  capturados: PedidoCapturado[] = [],
) {
  const usadas: Record<Tipo, number> = { uuid: 0, consulta: 0, pdf: 0 }

  await page.route(API_CERTIFICADOS, async (route) => {
    const request = route.request()
    const origem = (await request.headerValue('origin')) ?? '*'

    if (request.method() === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origem,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Accept, Accept-Language',
        },
      })
    }

    const tipo = tipoDo(request.url())
    const cabecalhos = await request.allHeaders()
    capturados.push({
      tipo,
      method: request.method(),
      url: request.url(),
      corpo: request.postData() ?? '',
      cookie: cabecalhos.cookie,
    })

    const configurada = respostas[tipo]
    const lista =
      configurada === undefined
        ? []
        : Array.isArray(configurada)
          ? configurada
          : [configurada]
    const resposta = lista[Math.min(usadas[tipo], lista.length - 1)]
    usadas[tipo] += 1
    if (resposta === undefined) return route.abort('failed')

    const cors = {
      'Access-Control-Allow-Origin': origem,
      'Access-Control-Expose-Headers': 'Content-Disposition, Retry-After',
    }
    if (tipo === 'pdf' && resposta.status === 200) {
      return route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${NOME_DO_PDF}"`,
          ...resposta.headers,
          ...cors,
        },
        body: '%PDF-1.4\n% PDF falso do E2E\n%%EOF\n',
      })
    }
    return route.fulfill({
      status: resposta.status,
      headers: {
        ...(resposta.corpo === undefined
          ? {}
          : { 'Content-Type': 'application/json' }),
        ...resposta.headers,
        ...cors,
      },
      body: resposta.corpo === undefined ? '' : JSON.stringify(resposta.corpo),
    })
  })
}
