import mediaTension from '../../assets/home-office-12.jpg'
import altaTension from '../../assets/LLVV_00-v1-BN2.jpeg'
import supervisor from '../../assets/LLVV_Mantas02-BN2.jpeg'
import { site } from '../../content/site'
import { Row } from '../layout/Row'

/**
 * Ordem medida em `dom.json`: a imagem do card i acompanha o curso i.
 *
 * O tamanho intrínseco anda junto com o arquivo porque é ele que decide o
 * tamanho renderizado: a referência não usa medida fixa, usa `max-width: 100%`
 * sobre o intrínseco de cada asset. Os cards 2 e 3 são quadrados de `250px` e
 * nunca crescem; o card 1 é `400x300` e encolhe com a coluna.
 * `docs/qa/paridade/2026-09-02/header-cursos.md` mede os três nas quatro
 * larguras.
 */
const MEDIA_TENSION = { src: mediaTension, width: 400, height: 300 }

const IMAGES = [
  MEDIA_TENSION,
  { src: altaTension, width: 250, height: 250 },
  { src: supervisor, width: 250, height: 250 },
]

export function Cursos() {
  return (
    <section
      id="Cursos"
      aria-labelledby="cursos-heading"
      /*
        docs/qa/paridade/2026-08-30/espacamento.md: a referência mede
        `marginBottom: -105px` em `#Cursos` nas quatro larguras, contra
        `paddingBottom: 110px` igual nos dois. A margem negativa cancela 105
        dos 110px: `#Contacto` começa 5px depois da linha do CTA, não 110px.
        Sem ela o clone abria 110px onde a referência abre 5px (achado C-2 da
        review; a decisão de reproduzir é de João, 2026-08-31).
      */
      className="-mb-26.25 bg-ink pb-27.5"
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
        {site.cursos.items.map((curso, index) => {
          const imagem = IMAGES[index] ?? MEDIA_TENSION
          return (
            <article key={curso.nombre} className="text-center">
              {/*
                Uma regra só, sem breakpoint: `max-w-full` + `h-auto` sobre o
                intrínseco reproduz as quatro larguras porque a coluna do clone
                já bate com a da referência. O `aspect-[4/3] w-full object-cover`
                anterior esticava e cortava os dois quadrados (D-28).
              */}
              <img
                src={imagem.src}
                alt={curso.imageAlt}
                width={imagem.width}
                height={imagem.height}
                loading="lazy"
                decoding="async"
                className="mx-auto h-auto max-w-full"
              />
              {/* 30px medidos até o nome do curso, contra os 24px de `mt-6`. */}
              <p className="mt-7.5 font-sans text-caption font-medium text-surface">
                {curso.nombre}
              </p>
            </article>
          )
        })}
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
