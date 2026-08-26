import mediaTension from '../../assets/home-office-12.jpg'
import altaTension from '../../assets/LLVV_00-v1-BN2.jpeg'
import supervisor from '../../assets/LLVV_Mantas02-BN2.jpeg'
import { site } from '../../content/site'
import { Row } from '../layout/Row'

/** Ordem medida em `dom.json`: a imagem do card i acompanha o curso i. */
const IMAGES = [mediaTension, altaTension, supervisor]

export function Cursos() {
  return (
    <section id="Cursos" className="bg-ink pb-[110px]">
      <Row className="py-[27px] text-center">
        <h2 className="font-display text-section font-bold text-brand">
          {site.cursos.heading}
        </h2>
        <p className="mx-auto max-w-lead font-display text-body font-medium text-surface">
          {site.cursos.intro}
        </p>
      </Row>

      <Row className="grid gap-gutter py-[27px] desktop:grid-cols-3">
        {site.cursos.items.map((curso, index) => (
          <article key={curso.nombre} className="text-center">
            <img
              src={IMAGES[index] ?? mediaTension}
              alt={curso.imageAlt}
              width={320}
              height={240}
              className="aspect-[4/3] w-full object-cover"
            />
            <p className="mt-6 font-display text-body font-medium text-surface">
              {curso.nombre}
            </p>
          </article>
        ))}
      </Row>

      <Row className="py-[27px] text-center">
        <a
          href={site.cursos.cta.href}
          className="inline-block rounded-pill border-4 border-solid border-ink bg-ink px-button-x py-button-y font-display text-button font-bold text-ink"
        >
          {site.cursos.cta.label}
        </a>
      </Row>
    </section>
  )
}
