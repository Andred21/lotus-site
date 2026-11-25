import { z } from 'zod'

/**
 * Certificado como a API pública do Lotus o devolve. `z.object` descarta
 * chave não declarada: `cliente` e `redator` morrem aqui (spec D4, P16).
 */
export const certificadoSchema = z.object({
  codigo: z.string().min(1),
  status: z.enum(['emitido', 'revocado']),
  valido_ate: z.iso.date().nullable(),
  revoked_at: z.iso.datetime({ offset: true }).nullable(),
  aluno: z.object({ name: z.string().min(1) }),
  curso: z.object({
    name: z.string().min(1),
    workload_hours: z.number().int().nonnegative(),
  }),
  turma: z.object({ end_date: z.iso.date().nullable() }),
  display_status: z.enum(['vigente', 'por_vencer', 'vencido', 'revocado']),
})

export type Certificado = z.infer<typeof certificadoSchema>

export type CampoDaConsulta = 'codigo' | 'rut'

export type ResultadoDaConsulta =
  | { tipo: 'certificado'; certificado: Certificado; uuid: string }
  | { tipo: 'nao-encontrado' }
  | { tipo: 'formato-invalido'; campos: CampoDaConsulta[] }
  | { tipo: 'espera'; segundos: number | null }
  | { tipo: 'bloqueio'; segundos: number }
  | { tipo: 'falha' }

export type ResultadoDoPdf =
  | { tipo: 'pdf'; arquivo: Blob; nome: string }
  | { tipo: 'revogado' }
  | { tipo: 'espera'; segundos: number | null }
  | { tipo: 'falha' }

export type ConsultaPorUuid = (uuid: string) => Promise<ResultadoDaConsulta>
export type ConsultaPorCodigo = (
  codigo: string,
  rut: string,
) => Promise<ResultadoDaConsulta>
export type BaixarPdf = (
  uuid: string,
  codigo: string,
) => Promise<ResultadoDoPdf>
