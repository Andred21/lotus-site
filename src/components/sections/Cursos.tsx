import mediaTension from '../../assets/home-office-12.jpg'
import altaTension from '../../assets/LLVV_00-v1-BN2.jpeg'
import supervisor from '../../assets/LLVV_Mantas02-BN2.jpeg'
import { site } from '../../content/site'
import { Row } from '../layout/Row'

/** Ordem medida em `dom.json`: a imagem do card i acompanha o curso i. */
const IMAGES = [mediaTension, altaTension, supervisor]

export function Cursos() {
  return (
    <section
      id="Cursos"
      aria-labelledby="cursos-heading"
      className="bg-ink pb-27.5"
    >
      <Row className="py-6.75 text-center">
        <h2
          id="cursos-heading"
          className="font-display text-section font-bold text-brand uppercase"
        >
          {site.cursos.heading}
        </h2>
        <p className="mx-auto max-w-lead font-display text-body font-medium text-surface">
          {site.cursos.intro}
        </p>
      </Row>

      {/*
        docs/qa/paridade/2026-08-30/espacamento.md (D9 resolvida): 59.39px é a
        calha HORIZONTAL entre colunas no desktop (--spacing-gutter está
        correto para esse eixo — não mexer no token). 30px é o gap VERTICAL
        entre cards empilhados no mobile, um eixo diferente que
        --spacing-gutter nunca deveria ter coberto sozinho via `gap-gutter`.
        O padding da linha também é responsivo: 30px em 375/768, 27px
        (`py-6.75`) a partir do breakpoint `desktop` (1000px).
      */}
      <Row className="grid gap-x-gutter gap-y-7.5 py-7.5 desktop:grid-cols-3 desktop:py-6.75">
        {site.cursos.items.map((curso, index) => (
          <article key={curso.nombre} className="text-center">
            <img
              src={IMAGES[index] ?? mediaTension}
              alt={curso.imageAlt}
              width={320}
              height={240}
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full object-cover"
            />
            <p className="mt-6 font-sans text-caption font-medium text-surface">
              {curso.nombre}
            </p>
          </article>
        ))}
      </Row>

      <Row className="py-6.75 text-center">
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
