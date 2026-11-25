const LIMITE = 20

/** Confere o RUT como o `Rut::parse` + `isValid` do Lotus: módulo 11, fatores 2..7. */
export function rutValido(entrada: string): boolean {
  const aparado = entrada.trim()
  if (aparado.length > LIMITE) return false

  const limpo = aparado.replace(/[^0-9kK]/g, '').toUpperCase()
  if (limpo.length < 2) return false

  const corpo = limpo.slice(0, -1)
  const digito = limpo.slice(-1)
  if (!/^\d+$/.test(corpo)) return false

  let soma = 0
  let fator = 2
  for (let i = corpo.length - 1; i >= 0; i--) {
    soma += Number(corpo[i]) * fator
    fator = fator === 7 ? 2 : fator + 1
  }
  const resto = 11 - (soma % 11)
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto)
  return digito === esperado
}
