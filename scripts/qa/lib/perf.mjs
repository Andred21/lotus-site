// Resumo legível do relatório do Lighthouse. Registra o que foi medido; não
// transforma score isolado em meta (aceite da EAP 6.2.1).

/**
 * @param {any} lhr
 * @returns {string}
 */
export function resumoMarkdown(lhr) {
  const categorias = Object.values(lhr.categories)
    .map(
      (categoria) =>
        `| ${categoria.title} | ${Math.round(categoria.score * 100)} |`,
    )
    .join('\n')

  const lcp = lhr.audits['largest-contentful-paint']
  const cls = lhr.audits['cumulative-layout-shift']
  const elemento =
    lhr.audits['largest-contentful-paint-element']?.details?.items?.[0]
      ?.items?.[0]?.node?.snippet ?? 'não reportado'

  return `# Lighthouse — build de produção

> URL medida: ${lhr.finalDisplayedUrl} · execução: ${lhr.fetchTime}
> Relatório cru: \`lighthouse.json\` nesta pasta.

## Categorias

| categoria | score |
| --------- | ----- |
${categorias}

## Core Web Vitals

- LCP: ${lcp.displayValue} (${Math.round(lcp.numericValue)} ms)
- CLS: ${cls.displayValue}
- elemento do LCP: ${elemento}

## Ressalva

Medição de **laboratório**, numa máquina só, contra \`vite preview\` local. Não é dado de campo e
não descreve o que um visitante real experimenta. Nenhum score aqui é meta: o que orienta a EAP
\`6.2.2\` é a causa apontada, não o número.
`
}
