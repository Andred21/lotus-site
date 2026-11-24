import type { ReactNode, Ref } from 'react'
import { validacao } from '../../content/validacao'
import type { Certificado } from '../../lib/certificado'
import { formatarDataCivil, formatarInstante } from '../../lib/datas'
import { Selo, type TomDoSelo } from './Selo'

const { linhas } = validacao

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <>
      {/* `body-ink` sobre `surface` dá 6,65:1; o `muted-ink` do mockup dava
          3,66:1, abaixo do AA. */}
      <dt className="text-body-ink">{rotulo}</dt>
      <dd className="m-0 text-title-light">{valor}</dd>
    </>
  )
}

// Escala do site (D3): os mockups são miniaturas (abertura em 12px, que na
// página é `text-body`, 16px). Cada tamanho do mockup é levado pela mesma
// proporção ao token mais próximo: título 15→20 (`highlight`), linhas
// 11,5→15 (`body`), notas 11→15 (`caption`). Abaixo de `desktop` o `h1` da
// página desce a `highlight`, e o cartão desce um passo junto: título
// `body`, linhas `caption`.
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
    <div className="bg-surface p-6 text-body-ink">
      <Selo tom={textos.tom}>{textos.selo}</Selo>
      <h2
        ref={tituloRef}
        tabIndex={-1}
        className="mt-3 mb-2 font-display text-body font-bold text-title-light outline-none desktop:text-highlight"
      >
        {textos.titulo}
      </h2>
      <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-4 font-sans text-caption desktop:text-body">
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
        <p className="mb-3 text-caption font-bold">
          {validacao.vigente.porVencer}
        </p>
      ) : null}
      {revogado ? null : pdf}
      {vencido ? (
        <p className="mt-2 text-caption">{validacao.vencido.nota}</p>
      ) : null}
      {revogado ? (
        <p className="text-caption">{validacao.revogado.nota}</p>
      ) : null}
    </div>
  )
}

function pick(t: { selo: string; titulo: string }) {
  return { selo: t.selo, titulo: t.titulo }
}
