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
    <div className="bg-surface p-4 text-body-ink">
      {selo ? <Selo tom="neutro">{selo}</Selo> : null}
      <h2
        ref={tituloRef}
        tabIndex={-1}
        className="mt-2 mb-1.5 font-display text-[15px] font-bold text-title-light outline-none"
      >
        {titulo}
      </h2>
      {children}
    </div>
  )
}
