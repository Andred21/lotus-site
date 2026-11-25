import { useState } from 'react'
import { emSegundos, validacao } from '../../content/validacao'
import type { ResultadoDoPdf } from '../../lib/certificado'
import { useContagemRegressiva } from './useContagemRegressiva'

/** Sem `Retry-After` utilizável, o botão volta em 60 s (D16, P5). */
const ESPERA_SEM_NUMERO_S = 60

type EstadoDoPdf =
  | { tipo: 'livre' }
  | { tipo: 'baixando' }
  | { tipo: 'espera'; segundos: number | null }
  | { tipo: 'falha' }

/**
 * O download sai de um `<a download>` temporário sobre a URL de objeto do
 * blob; a URL é revogada depois do clique, num `setTimeout(…, 0)`, para o
 * navegador já ter começado a ler o arquivo (spec §5.4).
 */
function salvar(arquivo: Blob, nome: string) {
  const url = URL.createObjectURL(arquivo)
  const ancora = document.createElement('a')
  ancora.href = url
  ancora.download = nome
  document.body.append(ancora)
  ancora.click()
  ancora.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function EsperaDoPdf({
  segundos,
  aoTerminar,
}: {
  segundos: number | null
  aoTerminar: () => void
}) {
  const restante = useContagemRegressiva(
    segundos ?? ESPERA_SEM_NUMERO_S,
    aoTerminar,
  )
  const { espera } = validacao
  return (
    <p className="mt-2 text-caption">
      {`${espera.titulo}. `}
      {segundos === null ? (
        espera.semNumero
      ) : (
        // A contagem não é anunciada a cada segundo (P9).
        <span aria-live="off">{emSegundos(restante)}</span>
      )}
    </p>
  )
}

/**
 * "DESCARGAR PDF" do cartão válido ou vencido. O 410 não é tratado aqui: o
 * cartão inteiro passa a revogado (P6), e quem decide isso é a página.
 */
export function BotaoDoPdf({
  baixar,
  aoRevogar,
}: {
  baixar: () => Promise<ResultadoDoPdf>
  aoRevogar: () => void
}) {
  const [estado, setEstado] = useState<EstadoDoPdf>({ tipo: 'livre' })
  const ocupado = estado.tipo === 'baixando' || estado.tipo === 'espera'

  async function clicar() {
    if (ocupado) return
    setEstado({ tipo: 'baixando' })
    const resultado = await baixar()
    switch (resultado.tipo) {
      case 'pdf':
        salvar(resultado.arquivo, resultado.nome)
        setEstado({ tipo: 'livre' })
        return
      case 'revogado':
        aoRevogar()
        return
      case 'espera':
        setEstado({ tipo: 'espera', segundos: resultado.segundos })
        return
      case 'falha':
        setEstado({ tipo: 'falha' })
        return
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={clicar}
        disabled={ocupado}
        className="rounded-pill border-2 border-solid border-title-light px-button-x py-1 font-display text-caption font-bold tracking-[2px] text-title-light uppercase disabled:opacity-60"
      >
        {validacao.pdf.botao}
      </button>
      {/* Cada espera nasce de `baixando`: a contagem sempre monta de novo. */}
      {estado.tipo === 'espera' ? (
        <EsperaDoPdf
          segundos={estado.segundos}
          aoTerminar={() => setEstado({ tipo: 'livre' })}
        />
      ) : null}
      {estado.tipo === 'falha' ? (
        <p className="mt-2 text-caption">{validacao.pdf.falha}</p>
      ) : null}
    </div>
  )
}
