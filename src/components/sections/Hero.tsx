import heroPhoto from '../../assets/shutterstock_1444636373-1-scaled.jpg'
import { site } from '../../content/site'

/**
 * Hero. Única seção full-bleed: a `.et_pb_row` do original mede
 * `max-width: 100%`, então `Row` não entra aqui. Os paddings da coluna de
 * texto são 10% e 8% do viewport nos quatro tamanhos medidos.
 * A foto só aparece no desktop — em 375/768 ela não é reposicionada, some.
 */
export function Hero() {
  return (
    <section id="Intrucción" className="grid bg-ink desktop:grid-cols-2">
      <div className="px-[8vw] py-[10vw]">
        <p className="font-display text-kicker font-medium text-surface">
          {site.hero.kicker}
        </p>
        <h1 className="font-display text-hero font-bold text-brand">
          {site.hero.title}
        </h1>
        <h3 className="font-sans text-subtitle font-medium text-surface">
          {site.hero.subtitle}
        </h3>
        <p className="mt-8 font-display text-body font-medium text-brand">
          {site.hero.body}
        </p>
        <a
          href={site.hero.cta.href}
          className="mt-8 inline-block rounded-pill border-4 border-solid border-ink bg-ink px-button-x py-button-y font-display text-button font-bold text-ink"
        >
          {site.hero.cta.label}
        </a>
      </div>
      <div
        aria-hidden
        className="hidden bg-cover bg-center desktop:block"
        style={{ backgroundImage: `url(${heroPhoto})` }}
      />
    </section>
  )
}
