import { useEffect, useEffectEvent, useState } from 'react'

/**
 * Conta de `segundos` até zero, um passo a cada 1000 ms desde a montagem, e
 * chama `aoTerminar` uma vez ao chegar a zero. Quem usa monta de novo (`key`)
 * a cada espera nova: `segundos` só é lido na montagem.
 *
 * Um intervalo só, e não um `setTimeout` por passo: a contagem não depende de
 * o React ter pintado o passo anterior para agendar o próximo.
 */
export function useContagemRegressiva(
  segundos: number,
  aoTerminar: () => void,
): number {
  const [restante, setRestante] = useState(segundos)
  const terminar = useEffectEvent(aoTerminar)

  // Sincroniza com o relógio. O StrictMode monta duas vezes no dev: a
  // limpeza para o primeiro intervalo e o segundo recomeça de `segundos`.
  useEffect(() => {
    let falta = segundos
    const id = setInterval(() => {
      falta -= 1
      setRestante(falta)
      if (falta <= 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [segundos])

  useEffect(() => {
    if (restante <= 0) terminar()
  }, [restante])

  return restante
}
