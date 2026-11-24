import type { Certificado } from './certificado'

export const UUID = '0f8fad5b-d9cb-469f-a165-70867728950e'

export const VIGENTE: Certificado = {
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
  display_status: 'vigente',
}

export const POR_VENCER: Certificado = {
  ...VIGENTE,
  display_status: 'por_vencer',
}

export const VENCIDO: Certificado = {
  ...VIGENTE,
  valido_ate: '2026-03-03',
  display_status: 'vencido',
}

export const REVOGADO: Certificado = {
  ...VIGENTE,
  status: 'revocado',
  revoked_at: '2026-10-05T14:30:00.000000Z',
  display_status: 'revocado',
}
