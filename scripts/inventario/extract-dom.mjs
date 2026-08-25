/// <reference lib="dom" />
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { OUT_DIR, SITE_URL, desktopViewport, openPage } from './lib/site.mjs'

const { browser, page } = await openPage(desktopViewport())

const inventory = await page.evaluate(() => {
  /** @type {(text: string) => string} */
  const clean = (text) => text.replace(/\s+/g, ' ').trim()

  const head = {
    title: document.title,
    description:
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content') ?? null,
    canonical:
      document.querySelector('link[rel="canonical"]')?.getAttribute('href') ??
      null,
    lang: document.documentElement.lang || null,
    openGraph: [...document.querySelectorAll('meta[property^="og:"]')].map(
      (tag) => ({
        property: tag.getAttribute('property'),
        content: tag.getAttribute('content'),
      }),
    ),
    generators: [...document.querySelectorAll('meta[name="generator"]')].map(
      (tag) => tag.getAttribute('content'),
    ),
  }

  const sections = [...document.querySelectorAll('section, [id]')]
    .filter(
      (element) => element.id && element.getBoundingClientRect().height > 40,
    )
    .map((element) => ({
      id: element.id,
      tag: element.tagName.toLowerCase(),
      headings: [...element.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(
        (heading) => ({
          level: heading.tagName.toLowerCase(),
          text: clean(heading.textContent ?? ''),
        }),
      ),
      texts: [
        ...element.querySelectorAll(
          'p, li, span.elementor-button-text, .et_pb_text_inner',
        ),
      ]
        .map((node) => clean(node.textContent ?? ''))
        .filter((text) => text.length > 0),
      links: [...element.querySelectorAll('a[href]')].map((anchor) => ({
        text: clean(anchor.textContent ?? ''),
        href: anchor.getAttribute('href'),
      })),
      images: [...element.querySelectorAll('img')].map((image) => ({
        src: image.currentSrc || image.src,
        alt: image.getAttribute('alt'),
      })),
    }))

  const forms = [...document.querySelectorAll('form')].map((form) => ({
    action: form.getAttribute('action'),
    method: form.getAttribute('method'),
    fields: [...form.querySelectorAll('input, textarea, select')].map(
      (field) => ({
        name: field.getAttribute('name'),
        type: field.getAttribute('type') ?? field.tagName.toLowerCase(),
        placeholder: field.getAttribute('placeholder'),
        required: field.hasAttribute('required'),
        ariaLabel: field.getAttribute('aria-label'),
      }),
    ),
    submitLabel: clean(
      form.querySelector('button, input[type="submit"]')?.textContent ?? '',
    ),
  }))

  const nav = [...document.querySelectorAll('a[href*="#"]')].map((anchor) => ({
    text: clean(anchor.textContent ?? ''),
    href: anchor.getAttribute('href'),
  }))

  return { head, nav, sections, forms }
})

await browser.close()

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(
  join(OUT_DIR, 'dom.json'),
  `${JSON.stringify({ capturedAt: new Date().toISOString(), url: SITE_URL, ...inventory }, null, 2)}\n`,
)
console.log('dom.json gravado')
