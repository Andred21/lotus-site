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
    <section
      id="Intrucción"
      aria-labelledby="hero-heading"
      className="grid bg-ink desktop:grid-cols-2"
    >
      <div className="px-[8vw] py-[10vw]">
        <p className="mb-[45px] font-display text-kicker font-medium text-surface">
          {site.hero.kicker}
        </p>
        {/* A reserva lateral é medida, não estética: sem ela o título cabe numa
            linha só e o clone diverge do baseline em 375 e 1440. */}
        <div className="pr-hero-inset">
          {/* `paddingBottom: 10px` medido no título e na tagline da
              referência (docs/qa/paridade/2026-08-30/espacamento.md,
              `hero.titulo` e `hero.subtitulo`, nas quatro larguras). */}
          <h1
            id="hero-heading"
            className="pb-2.5 font-display text-hero font-bold text-brand"
          >
            {site.hero.title}
          </h1>
          {/* Tagline, não título de seção: era `h3` pulando o `h2` (D2 do
              bloco 5.1.1-5.3.2). A classe é a mesma — zero pixel. */}
          <p className="pb-2.5 font-sans text-subtitle font-medium text-surface">
            {site.hero.subtitle}
          </p>
        </div>
        <p className="mt-[40px] font-display text-body font-medium text-brand">
          {site.hero.body}
        </p>
        <a
          href={site.hero.cta.href}
          className="mt-[50px] inline-block rounded-pill border-4 border-solid border-ink bg-ink px-button-x py-button-y font-display text-button font-bold text-ink"
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
