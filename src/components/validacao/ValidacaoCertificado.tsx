import { useEffect, useRef, useState, type ReactNode } from 'react'
import { emMinutos, validacao } from '../../content/validacao'
import type {
  BaixarPdf,
  ConsultaPorCodigo,
  ConsultaPorUuid,
  ResultadoDaConsulta,
} from '../../lib/certificado'
import type { ModoDaValidacao } from '../../lib/modo-da-validacao'
import { Row } from '../layout/Row'
import { BotaoDoPdf } from './BotaoDoPdf'
import { CartaoDeAviso } from './CartaoDeAviso'
import { CartaoDoCertificado } from './CartaoDoCertificado'
import { EsperaComContagem } from './EsperaComContagem'
import {
  FormularioDeConsulta,
  type EstadoDoFormulario,
} from './FormularioDeConsulta'

type EstadoDaPagina =
  { tipo: 'vazio' } | { tipo: 'validando' } | ResultadoDaConsulta

const CLASSE_DA_NOTA = 'text-caption'

/**
 * Página de validação (spec §5.4, D3, D8). Modo formulário: o resultado
 * aparece abaixo do formulário, que continua lá, e a URL não muda — o `uuid`
 * do 200 vive só neste estado, para o PDF. Modo QR: consulta o `uuid` do
 * caminho ao abrir e mostra só o resultado e o link para `/validar`.
 */
export function ValidacaoCertificado({
  modo,
  consultarPorUuid,
  consultarPorCodigo,
  baixarPdf,
}: {
  modo: ModoDaValidacao
  consultarPorUuid: ConsultaPorUuid
  consultarPorCodigo: ConsultaPorCodigo
  baixarPdf: BaixarPdf
}) {
  const uuidDoQr = modo.tipo === 'qr' ? modo.uuid : null
  const [estado, setEstado] = useState<EstadoDaPagina>(
    uuidDoQr === null ? { tipo: 'vazio' } : { tipo: 'validando' },
  )
  // Conta as consultas: chave da espera e gatilho da nova consulta pelo QR.
  const [tentativa, setTentativa] = useState(0)
  const tituloRef = useRef<HTMLHeadingElement>(null)
  // Foco no título só depois de ação de quem usa (P8): envio ou 410 do PDF.
  const focarNoResultado = useRef(false)
  // Dois envios no mesmo tique (Enter + clique) não pedem duas vezes.
  const consultando = useRef(false)
  // O estado já pintado, para quem responde depois de um `await` (o PDF).
  const estadoAtual = useRef(estado)
  useEffect(() => {
    estadoAtual.current = estado
  }, [estado])

  // Sincroniza com a rede no modo QR. O StrictMode monta duas vezes no dev:
  // a limpeza descarta a resposta da primeira montagem.
  useEffect(() => {
    if (uuidDoQr === null) return
    let cancelado = false
    void consultarPorUuid(uuidDoQr).then((resultado) => {
      if (!cancelado) setEstado(resultado)
    })
    return () => {
      cancelado = true
    }
  }, [uuidDoQr, consultarPorUuid, tentativa])

  // Sincroniza o foco com o DOM já pintado: o título precisa existir.
  useEffect(() => {
    if (estado.tipo === 'vazio' || estado.tipo === 'validando') return
    if (!focarNoResultado.current) return
    focarNoResultado.current = false
    tituloRef.current?.focus()
  }, [estado])

  async function consultar(codigo: string, rut: string) {
    if (consultando.current || estado.tipo === 'espera') return
    consultando.current = true
    focarNoResultado.current = true
    setEstado({ tipo: 'validando' })
    setTentativa((n) => n + 1)
    const resultado = await consultarPorCodigo(codigo, rut)
    consultando.current = false
    setEstado(resultado)
  }

  // P4: no formulário o cartão some e VALIDAR volta; pelo QR, não há botão
  // para tentar de novo, então a página repete a consulta.
  function terminarEspera() {
    if (uuidDoQr === null) {
      setEstado({ tipo: 'vazio' })
      return
    }
    setEstado({ tipo: 'validando' })
    setTentativa((n) => n + 1)
  }

  // P6: o mesmo certificado, agora revogado; `revoked_at` continua o que era
  // (nulo num válido), e a linha "Revocado el" é omitida. O PDF pode levar
  // 30 s e o formulário segue usável: um 410 atrasado de um certificado que
  // já saiu da tela não toca no que está nela, nem no foco.
  function revogar(uuid: string) {
    const atual = estadoAtual.current
    if (atual.tipo !== 'certificado' || atual.uuid !== uuid) return
    focarNoResultado.current = true
    setEstado({
      ...atual,
      certificado: { ...atual.certificado, display_status: 'revocado' },
    })
  }

  let resultado: ReactNode = null
  switch (estado.tipo) {
    case 'validando':
      // No formulário, o próprio botão diz "Validando…".
      resultado =
        uuidDoQr === null ? null : (
          <p className="font-display text-body text-white">
            {validacao.validando}
          </p>
        )
      break
    case 'certificado': {
      const { uuid, certificado } = estado
      resultado = (
        <CartaoDoCertificado
          certificado={certificado}
          tituloRef={tituloRef}
          pdf={
            <BotaoDoPdf
              baixar={() => baixarPdf(uuid, certificado.codigo)}
              aoRevogar={() => revogar(uuid)}
            />
          }
        />
      )
      break
    }
    case 'nao-encontrado': {
      const textos =
        uuidDoQr === null
          ? validacao.naoEncontrado.formulario
          : validacao.naoEncontrado.qr
      resultado = (
        <CartaoDeAviso
          selo={validacao.naoEncontrado.selo}
          titulo={textos.titulo}
          tituloRef={tituloRef}
        >
          <div className="space-y-2">
            {textos.notas.map((nota) => (
              <p key={nota} className={CLASSE_DA_NOTA}>
                {nota}
              </p>
            ))}
          </div>
        </CartaoDeAviso>
      )
      break
    }
    case 'espera':
      resultado = (
        <EsperaComContagem
          key={tentativa}
          segundos={estado.segundos}
          aoTerminar={terminarEspera}
          tituloRef={tituloRef}
        />
      )
      break
    case 'bloqueio': {
      const { bloqueio } = validacao
      resultado = (
        <CartaoDeAviso
          selo={bloqueio.selo}
          titulo={bloqueio.titulo}
          tituloRef={tituloRef}
        >
          <div className="space-y-2">
            <p className={CLASSE_DA_NOTA}>
              {`${bloqueio.motivo} `}
              {/* Minutos para cima, fixos desde a chegada do 429 (§5.4). */}
              <span>{emMinutos(Math.ceil(estado.segundos / 60))}</span>
            </p>
            <p className={CLASSE_DA_NOTA}>
              <strong>{bloqueio.qrDestaque}</strong> {bloqueio.qrResto}
            </p>
          </div>
        </CartaoDeAviso>
      )
      break
    }
    case 'falha':
      resultado = (
        <CartaoDeAviso titulo={validacao.falha} tituloRef={tituloRef}>
          {null}
        </CartaoDeAviso>
      )
      break
    case 'vazio':
    case 'formato-invalido':
      break
  }

  // O bloqueio não trava o formulário: outro certificado, com outro RUT,
  // ainda pode passar (§5.4). Só a espera de até 60 s desativa VALIDAR.
  const estadoDoFormulario: EstadoDoFormulario =
    estado.tipo === 'validando'
      ? 'validando'
      : estado.tipo === 'espera'
        ? 'esperando'
        : 'livre'

  return (
    <div className="grow bg-ink pt-14.25 pb-14.5">
      <Row>
        <p className="font-display text-kicker text-white uppercase">
          {validacao.kicker}
        </p>
        {/* Abaixo de `desktop`, 42px quebra "CERTIFICADO" no meio da palavra
            em 375 (overflow-wrap da base); o título desce a `highlight`. */}
        <h1 className="mt-1.5 mb-2 font-display text-highlight font-bold text-brand desktop:text-section">
          {validacao.titulo}
        </h1>

        {uuidDoQr === null ? (
          <>
            <p className="max-w-lead font-display text-body font-medium text-white">
              {validacao.abertura}
            </p>
            <div className="mt-6 bg-surface px-6 py-6.75">
              <FormularioDeConsulta
                estado={estadoDoFormulario}
                errosDoServidor={
                  estado.tipo === 'formato-invalido' ? estado.campos : []
                }
                aoEnviar={consultar}
              />
            </div>
          </>
        ) : null}

        <div aria-live="polite">
          {resultado ? <div className="mt-4">{resultado}</div> : null}
        </div>

        {uuidDoQr === null ? (
          <p className="mt-4 font-display text-body font-medium text-white">
            {validacao.linhaDoQr}
          </p>
        ) : (
          <p className="mt-6 font-display text-body font-medium">
            <a href="/validar" className="text-link">
              {validacao.outroCertificado}
            </a>
          </p>
        )}
      </Row>
    </div>
  )
}
