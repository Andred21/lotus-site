import type { Ref } from 'react'
import { emSegundos, validacao } from '../../content/validacao'
import { CartaoDeAviso } from './CartaoDeAviso'
import { useContagemRegressiva } from './useContagemRegressiva'

/** Sem `Retry-After` utilizável, a espera dura 60 s, sem número na tela (D16). */
const ESPERA_SEM_NUMERO_S = 60

/**
 * Cartão ESPERE do 429 de até 60 s. O número fica num `aria-live="off"`
 * dentro da região `polite` da página: o cartão é anunciado quando chega, a
 * contagem não é anunciada a cada segundo (P9).
 */
export function EsperaComContagem({
  segundos,
  aoTerminar,
  tituloRef,
}: {
  segundos: number | null
  aoTerminar: () => void
  tituloRef?: Ref<HTMLHeadingElement>
}) {
  const restante = useContagemRegressiva(
    segundos ?? ESPERA_SEM_NUMERO_S,
    aoTerminar,
  )
  const { espera } = validacao

  return (
    <CartaoDeAviso
      selo={espera.selo}
      titulo={espera.titulo}
      tituloRef={tituloRef}
    >
      <p className="text-caption">
        {segundos === null ? (
          espera.semNumero
        ) : (
          <span aria-live="off">{emSegundos(restante)}</span>
        )}
      </p>
    </CartaoDeAviso>
  )
}
