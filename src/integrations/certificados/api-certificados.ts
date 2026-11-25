import { z } from 'zod'
import {
  certificadoSchema,
  type BaixarPdf,
  type CampoDaConsulta,
  type ConsultaPorCodigo,
  type ConsultaPorUuid,
  type ResultadoDaConsulta,
  type ResultadoDoPdf,
} from '../../lib/certificado'
import { normalizarCodigo } from '../../lib/codigo-de-registro'

/** Origem da API pública do Lotus; produção não define a variável (D10). */
export const URL_PADRAO_DA_API = 'https://app.lotusotec.cl'

/** Teto de espera de uma consulta (P3). */
export const TEMPO_LIMITE_MS = 15_000

/** O PDF é renderizado a cada pedido (K2): teto maior (P3). */
export const TEMPO_LIMITE_DO_PDF_MS = 30_000

/** Até aqui o 429 da consulta é espera; acima, bloqueio (D16). */
export const LIMITE_DA_ESPERA_S = 60

const CAMINHO = '/api/publico/certificados'

const consultaSchema = certificadoSchema.extend({ uuid: z.guid() })

/** `Retry-After` em segundos inteiros positivos; data HTTP ou lixo viram `null`. */
export function lerRetryAfter(valor: string | null): number | null {
  if (valor === null || !/^\d+$/.test(valor)) return null
  const segundos = Number(valor)
  return segundos > 0 ? segundos : null
}

/** `filename` do `Content-Disposition`, sem diretório; senão o nome padrão. */
export function nomeDoArquivo(
  contentDisposition: string | null,
  codigo: string,
): string {
  const padrao = `certificado-${codigo}.pdf`
  const achado = contentDisposition?.match(/filename=(?:"([^"]*)"|([^;\s]+))/i)
  const bruto = achado?.[1] ?? achado?.[2] ?? ''
  const nome = bruto.split(/[\\/]/).pop() ?? ''
  return nome === '' || nome === '.' || nome === '..' ? padrao : nome
}

async function lerJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

function camposDoErro(corpo: unknown): CampoDaConsulta[] {
  const todos: CampoDaConsulta[] = ['codigo', 'rut']
  if (typeof corpo !== 'object' || corpo === null) return todos
  const errors = (corpo as { errors?: unknown }).errors
  if (typeof errors !== 'object' || errors === null) return todos
  const achados = todos.filter((campo) => campo in errors)
  return achados.length > 0 ? achados : todos
}

/**
 * Adapter da API pública de certificados do Lotus (spec §5.5, D10, D16).
 * Classifica pelo status HTTP, nunca pelo corpo (P14); só o 200 e o 422 leem
 * corpo. Nunca lança: rede, teto e resposta fora do contrato viram `falha`.
 * Todo pedido leva `credentials: 'omit'` e só `Accept`/`Content-Type`.
 */
export function createCertificadosApi(base: string): {
  porUuid: ConsultaPorUuid
  porCodigo: ConsultaPorCodigo
  pdf: BaixarPdf
} {
  const raiz = base.replace(/\/+$/, '')

  async function pedir<T>(
    caminho: string,
    init: RequestInit,
    tetoMs: number,
    tratar: (response: Response) => Promise<T>,
    falha: T,
  ): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), tetoMs)
    try {
      const response = await fetch(`${raiz}${CAMINHO}${caminho}`, {
        ...init,
        credentials: 'omit',
        signal: controller.signal,
      })
      return await tratar(response)
    } catch {
      return falha
    } finally {
      clearTimeout(timer)
    }
  }

  const FALHA: ResultadoDaConsulta = { tipo: 'falha' }

  const porUuid: ConsultaPorUuid = (uuid) =>
    pedir<ResultadoDaConsulta>(
      `/${uuid}`,
      { method: 'GET', headers: { Accept: 'application/json' } },
      TEMPO_LIMITE_MS,
      async (response) => {
        if (response.status === 404) return { tipo: 'nao-encontrado' }
        if (response.status === 429) {
          return {
            tipo: 'espera',
            segundos: lerRetryAfter(response.headers.get('Retry-After')),
          }
        }
        if (response.status !== 200) return FALHA
        const parsed = certificadoSchema.safeParse(await lerJson(response))
        return parsed.success
          ? { tipo: 'certificado', certificado: parsed.data, uuid }
          : FALHA
      },
      FALHA,
    )

  const porCodigo: ConsultaPorCodigo = (codigo, rut) =>
    pedir<ResultadoDaConsulta>(
      '/consulta',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo: normalizarCodigo(codigo),
          rut: rut.trim(),
        }),
      },
      TEMPO_LIMITE_MS,
      async (response) => {
        if (response.status === 404) return { tipo: 'nao-encontrado' }
        if (response.status === 422) {
          return {
            tipo: 'formato-invalido',
            campos: camposDoErro(await lerJson(response)),
          }
        }
        if (response.status === 429) {
          const segundos = lerRetryAfter(response.headers.get('Retry-After'))
          if (segundos === null) return { tipo: 'espera', segundos: null }
          return segundos <= LIMITE_DA_ESPERA_S
            ? { tipo: 'espera', segundos }
            : { tipo: 'bloqueio', segundos }
        }
        if (response.status !== 200) return FALHA
        const parsed = consultaSchema.safeParse(await lerJson(response))
        if (!parsed.success) return FALHA
        const { uuid, ...certificado } = parsed.data
        return { tipo: 'certificado', certificado, uuid }
      },
      FALHA,
    )

  const pdf: BaixarPdf = (uuid, codigo) =>
    pedir<ResultadoDoPdf>(
      `/${uuid}/pdf`,
      { method: 'GET', headers: { Accept: 'application/pdf' } },
      TEMPO_LIMITE_DO_PDF_MS,
      async (response) => {
        if (response.status === 410) return { tipo: 'revogado' }
        if (response.status === 429) {
          return {
            tipo: 'espera',
            segundos: lerRetryAfter(response.headers.get('Retry-After')),
          }
        }
        if (response.status !== 200) return { tipo: 'falha' }
        return {
          tipo: 'pdf',
          arquivo: await response.blob(),
          nome: nomeDoArquivo(
            response.headers.get('Content-Disposition'),
            codigo,
          ),
        }
      },
      { tipo: 'falha' },
    )

  return { porUuid, porCodigo, pdf }
}
