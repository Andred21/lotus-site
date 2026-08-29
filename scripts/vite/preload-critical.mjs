// Plugin de build: injeta `<link rel="preload">` para os assets acima da
// dobra. O Vite fingerprinta o nome dos arquivos, então o href só existe
// depois do bundle — daí `transformIndexHtml` com acesso a `ctx.bundle`.

/**
 * Padrão do arquivo no bundle e atributos do link gerado.
 * @type {{ padrao: RegExp, attrs: Record<string, string> }[]}
 */
const ALVOS = [
  {
    // Débito descoberto na rodada de QA 2026-08-29: `montserrat-400.woff2`,
    // `montserrat-500.woff2` e `montserrat-700.woff2` em `src/assets/fonts/`
    // são bytes idênticos (mesmo sha256) — um sprint anterior fez self-host
    // copiando o mesmo arquivo três vezes em vez de baixar cada peso real.
    // O Vite dedupe por conteúdo: as três declarações `@font-face` do build
    // apontam hoje para o mesmo arquivo físico, cujo nome herda o prefixo do
    // primeiro `@font-face` declarado em `index.css` (`400`). É esse arquivo
    // que o `<h1 id="hero-heading">` (elemento do LCP, `font-bold` = peso
    // 700) carrega de verdade — por isso o alvo aqui é `400`, não `700`.
    // Revisar quando os três pesos virarem arquivos de fato distintos.
    padrao: /montserrat-400-[^/]*\.woff2$/,
    attrs: { as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
  },
  {
    padrao: /open-sans-500-[^/]*\.woff2$/,
    attrs: { as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
  },
  {
    padrao: /shutterstock_1444636373-1-scaled-[^/]*\.jpg$/,
    // A foto do hero é `desktop:block`: abaixo de 1000px ela nunca pinta.
    attrs: { as: 'image', media: '(min-width: 1000px)' },
  },
]

/**
 * O handler mora fora do plugin para o teste poder chamá-lo sem depender do
 * tipo `Plugin` do Vite, que é uma união e derruba o `checkJs` do repositório.
 * @param {{ bundle?: Record<string, { fileName?: string }> }} ctx
 * @returns {{ tag: string, injectTo: string, attrs: Record<string, string> }[]}
 */
export function preloadTags(ctx) {
  if (!ctx.bundle) return []
  const arquivos = Object.values(ctx.bundle)
    .map((saida) => saida.fileName)
    .filter((fileName) => typeof fileName === 'string')

  return ALVOS.flatMap((alvo) => {
    const encontrado = arquivos.find((fileName) => alvo.padrao.test(fileName))
    if (!encontrado) return []
    return [
      {
        tag: 'link',
        injectTo: 'head-prepend',
        attrs: { rel: 'preload', href: `/${encontrado}`, ...alvo.attrs },
      },
    ]
  })
}

export function preloadCritical() {
  return {
    name: 'lotus-preload-critical',
    transformIndexHtml: {
      order: /** @type {const} */ ('post'),
      /**
       * @param {string} _html
       * @param {{ bundle?: Record<string, { fileName?: string }> }} ctx
       */
      handler: (_html, ctx) => preloadTags(ctx),
    },
  }
}
