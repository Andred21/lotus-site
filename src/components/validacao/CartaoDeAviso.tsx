import type { ReactNode, Ref } from 'react'
import { Selo } from './Selo'

export function CartaoDeAviso({
  selo,
  titulo,
  children,
  tituloRef,
}: {
  selo?: string
  titulo: string
  children: ReactNode
  tituloRef?: Ref<HTMLHeadingElement>
}) {
  return (
    <div className="bg-surface p-6 text-body-ink">
      {selo ? <Selo tom="neutro">{selo}</Selo> : null}
      <h2
        ref={tituloRef}
        tabIndex={-1}
        className="mt-3 mb-2 font-display text-body font-bold text-title-light outline-none desktop:text-highlight"
      >
        {titulo}
      </h2>
      {children}
    </div>
  )
}
