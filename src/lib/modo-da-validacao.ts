export type ModoDaValidacao =
  { tipo: 'formulario' } | { tipo: 'qr'; uuid: string }

// Mesma expressão da borda (infra/lotus-site.yaml, scripts/infra/lib/validar.mjs).
const CAMINHO_QR =
  /^\/validar\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

export function lerModo(pathname: string): ModoDaValidacao {
  const uuid = CAMINHO_QR.exec(pathname)?.[1]
  return uuid === undefined ? { tipo: 'formulario' } : { tipo: 'qr', uuid }
}
