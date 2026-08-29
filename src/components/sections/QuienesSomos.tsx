import institucional from '../../assets/LOTUS-G2_TRANSP_Fondo-Blanco.png'
import { site } from '../../content/site'
import { Row } from '../layout/Row'

/** Primeira linha de `#Somos`: logotipo e corpo institucional lado a lado. */
export function QuienesSomos() {
  return (
    <Row className="grid items-center gap-gutter pt-[30px] pb-px desktop:grid-cols-[320px_700px]">
      <img
        src={institucional}
        alt={site.institucional.logoAlt}
        width={320}
        height={320}
        loading="lazy"
        decoding="async"
        className="mx-auto w-full max-w-[320px]"
      />
      <p className="font-sans text-lead font-medium text-body-ink">
        {site.institucional.body}
      </p>
    </Row>
  )
}
