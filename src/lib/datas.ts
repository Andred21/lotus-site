function formatador(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  })
}

/** `AAAA-MM-DD` é data civil: nunca passa por `new Date('AAAA-MM-DD')`, que desloca o dia. */
export function formatarDataCivil(data: string): string {
  const [ano = 0, mes = 1, dia = 1] = data.split('-').map(Number)
  return formatador('UTC').format(new Date(Date.UTC(ano, mes - 1, dia)))
}

/** O Carbon manda microssegundos; o `Date` do WebKit não os aceita, então a fração cai para milissegundos. */
export function formatarInstante(instante: string): string {
  return formatador('America/Santiago').format(
    new Date(instante.replace(/\.(\d{3})\d+/, '.$1')),
  )
}
