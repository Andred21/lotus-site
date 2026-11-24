import type { ReactNode, Ref } from 'react'
import { validacao } from '../../content/validacao'
import type { Certificado } from '../../lib/certificado'
import { formatarDataCivil, formatarInstante } from '../../lib/datas'
import { Selo, type TomDoSelo } from './Selo'

const { linhas } = validacao

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <>
      <dt className="text-muted-ink">{rotulo}</dt>
      <dd className="m-0 text-title-light">{valor}</dd>
    </>
  )
}

// A página não calcula estado (D4): só o display_status da API escolhe o cartão.
export function CartaoDoCertificado({
  certificado,
  pdf,
  tituloRef,
}: {
  certificado: Certificado
  pdf?: ReactNode
  tituloRef?: Ref<HTMLHeadingElement>
}) {
  const { display_status: estado } = certificado
  const revogado = estado === 'revocado'
  const vencido = estado === 'vencido'

  const textos: { tom: TomDoSelo; selo: string; titulo: string } = revogado
    ? { tom: 'perigo', ...pick(validacao.revogado) }
    : vencido
      ? { tom: 'aviso', ...pick(validacao.vencido) }
      : { tom: 'ok', ...pick(validacao.vigente) }

  const { valido_ate: validoAte, revoked_at: revogadoEm } = certificado
  const termino = certificado.turma.end_date

  return (
    <div className="bg-surface p-4 text-body-ink">
      <Selo tom={textos.tom}>{textos.selo}</Selo>
      <h2
        ref={tituloRef}
        tabIndex={-1}
        className="mt-2 mb-1.5 font-display text-[15px] font-bold text-title-light outline-none"
      >
        {textos.titulo}
      </h2>
      <dl className="mb-2.5 grid grid-cols-[92px_1fr] gap-x-2 gap-y-px text-[11.5px]">
        <Linha rotulo={linhas.codigo} valor={certificado.codigo} />
        {revogado ? (
          revogadoEm ? (
            <Linha
              rotulo={linhas.revogadoEm}
              valor={formatarInstante(revogadoEm)}
            />
          ) : null
        ) : (
          <>
            <Linha rotulo={linhas.aluno} valor={certificado.aluno.name} />
            <Linha
              rotulo={linhas.curso}
              valor={`${certificado.curso.name} · ${certificado.curso.workload_hours} h`}
            />
            {termino ? (
              <Linha
                rotulo={linhas.termino}
                valor={formatarDataCivil(termino)}
              />
            ) : null}
            {validoAte ? (
              <Linha
                rotulo={vencido ? linhas.vencidoEm : linhas.validoAte}
                valor={formatarDataCivil(validoAte)}
              />
            ) : null}
          </>
        )}
      </dl>
      {estado === 'por_vencer' ? (
        <p className="mb-2 text-[11px] font-bold">
          {validacao.vigente.porVencer}
        </p>
      ) : null}
      {revogado ? null : pdf}
      {vencido ? (
        <p className="mt-1.5 text-[11px]">{validacao.vencido.nota}</p>
      ) : null}
      {revogado ? (
        <p className="text-[11px]">{validacao.revogado.nota}</p>
      ) : null}
    </div>
  )
}

function pick(t: { selo: string; titulo: string }) {
  return { selo: t.selo, titulo: t.titulo }
}
