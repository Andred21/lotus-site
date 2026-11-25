const LIMITE = 20
const FORMATO = /^LOT-\d{4}-\d{1,9}$/

export function normalizarCodigo(entrada: string): string {
  return entrada.trim().toUpperCase()
}

export function codigoValido(entrada: string): boolean {
  const codigo = normalizarCodigo(entrada)
  return codigo.length <= LIMITE && FORMATO.test(codigo)
}
