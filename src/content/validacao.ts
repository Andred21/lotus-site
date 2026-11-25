export const validacao = {
  kicker: 'CERTIFICADOS LOTUS OTEC',
  titulo: 'VALIDAR CERTIFICADO',
  abertura:
    'Ingrese el N° de registro y el RUT del alumno, tal como aparecen en el certificado.',
  campos: {
    codigo: {
      rotulo: 'N° de registro',
      exemplo: 'Ej.: LOT-2026-123',
      erro: 'Formato: LOT-2026-123',
    },
    rut: {
      rotulo: 'RUT del alumno',
      exemplo: 'Ej.: 12.345.678-5',
      erro: 'RUT inválido',
    },
  },
  botao: 'VALIDAR',
  validando: 'Validando…',
  linhaDoQr:
    '¿Tiene el certificado a mano? Escanee el código QR: abre la validación directamente.',
  outroCertificado: 'Validar otro certificado',
  linhas: {
    codigo: 'N° de registro',
    aluno: 'Alumno',
    curso: 'Curso',
    termino: 'Término',
    validoAte: 'Válido hasta',
    vencidoEm: 'Venció el',
    revogadoEm: 'Revocado el',
  },
  vigente: {
    selo: 'VIGENTE',
    titulo: 'Certificado válido',
    porVencer: 'Próximo a vencer',
  },
  vencido: {
    selo: 'VENCIDO',
    titulo: 'Certificado vencido',
    nota: 'El certificado fue emitido por Lotus OTEC, pero ya no está vigente.',
  },
  revogado: {
    selo: 'REVOCADO',
    titulo: 'Certificado revocado',
    nota: 'Este certificado fue revocado por Lotus OTEC y no tiene validez. Su PDF no está disponible.',
  },
  naoEncontrado: {
    selo: 'SIN RESULTADO',
    formulario: {
      titulo: 'No encontramos un certificado con esos datos',
      notas: [
        'Revise el N° de registro y el RUT del alumno tal como aparecen en el certificado.',
        'También puede escanear el código QR del certificado.',
      ],
    },
    qr: {
      titulo: 'No encontramos este certificado',
      notas: ['Revise que el código QR escaneado sea el del certificado.'],
    },
  },
  espera: {
    selo: 'ESPERE',
    titulo: 'Demasiadas consultas seguidas',
    semNumero: 'Intente de nuevo en unos momentos.',
  },
  bloqueio: {
    selo: 'BLOQUEADO',
    titulo: 'La consulta por N° de registro y RUT está bloqueada',
    motivo: 'Hubo demasiados intentos sin resultado.',
    qrDestaque: 'Mientras tanto, escanee el código QR del certificado:',
    qrResto: 'esa validación no tiene este bloqueo.',
  },
  falha: 'No pudimos validar el certificado ahora. Intente más tarde.',
  pdf: {
    botao: 'DESCARGAR PDF',
    falha: 'No pudimos descargar el PDF ahora. Intente más tarde.',
  },
} as const

export function emSegundos(n: number): string {
  return `Intente de nuevo en ${n} ${n === 1 ? 'segundo' : 'segundos'}.`
}

export function emMinutos(n: number): string {
  return `Podrá intentar de nuevo en ${n} ${n === 1 ? 'minuto' : 'minutos'}.`
}
