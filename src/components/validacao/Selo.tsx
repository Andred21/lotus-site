import type { ReactNode } from 'react'

export type TomDoSelo = 'ok' | 'aviso' | 'perigo' | 'neutro'

const FUNDO: Record<TomDoSelo, string> = {
  ok: 'bg-status-ok',
  aviso: 'bg-status-warn',
  perigo: 'bg-danger',
  neutro: 'bg-accent-ink',
}

export function Selo({
  tom,
  children,
}: {
  tom: TomDoSelo
  children: ReactNode
}) {
  return (
    <span
      className={`inline-block rounded-pill px-2.5 py-0.5 font-display text-[10px] font-bold tracking-[2px] text-white ${FUNDO[tom]}`}
    >
      {children}
    </span>
  )
}
