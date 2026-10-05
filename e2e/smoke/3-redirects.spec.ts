import { DOMINIO, WWW, expect, test } from './alvo'
import { pedir } from './rede'

// Os pares crus da query, ordenados pela chave; os valores de uma mesma chave
// ficam na ordem em que vieram (o sort é estável).
function porChave(query: string): string[] {
  const chave = (par: string) => par.split('=', 1)[0] ?? ''
  return query
    .split('&')
    .sort((x, y) => (chave(x) < chave(y) ? -1 : chave(x) > chave(y) ? 1 : 0))
}

// Spec D6: http → https é do ViewerProtocolPolicy; www → apex é a função.
// http://www faz dois saltos, aceitos e registrados na cadeia.
test('3 · redirects: http → https, www → apex com caminho e query; cadeia registrada', async ({
  destino,
}) => {
  const cadeia: string[] = []
  const passo = async (url: string) => {
    try {
      const r = await pedir(destino, url)
      cadeia.push(`${url} → ${r.status} ${r.headers.location ?? ''}`)
      return r
    } catch (erro) {
      cadeia.push(
        `${url} → ERRO ${erro instanceof Error ? erro.message : String(erro)}`,
      )
      throw erro
    }
  }

  // A cadeia sai no `finally`: numa execução vermelha ela é a primeira coisa
  // a olhar, e o primeiro `expect` que reprova interrompe o resto.
  try {
    const http = await passo(`http://${DOMINIO}/`)
    expect(http.status).toBe(301)
    expect(http.headers.location).toBe(`https://${DOMINIO}/`)

    // Caminho exato; da query, cada par cru (o `%26` não pode virar `&`) e a
    // ordem dos valores de uma mesma chave. A ordem entre chaves diferentes,
    // não: é a do objeto `querystring` que o CloudFront entrega à função, que
    // não recebe a query crua — na borda, em 2026-10-04, `?a=1&b=x` saiu
    // `?b=x&a=1`.
    const query = 'a=1&a=2&b=x%26y'
    const www = await passo(`https://${WWW}/cursos/?${query}`)
    expect(www.status).toBe(301)
    const [, caminho, volta] =
      /^([^?]*)\?(.*)$/.exec(www.headers.location ?? '') ?? []
    expect(caminho).toBe(`https://${DOMINIO}/cursos/`)
    expect(porChave(volta ?? '')).toEqual(porChave(query))

    const httpWww = await passo(`http://${WWW}/x?y=1`)
    expect(httpWww.status).toBe(301)
    expect(httpWww.headers.location).toBe(`https://${WWW}/x?y=1`)
    const segundo = await passo(httpWww.headers.location ?? '')
    expect(segundo.status).toBe(301)
    expect(segundo.headers.location).toBe(`https://${DOMINIO}/x?y=1`)
  } finally {
    console.log(cadeia.map((linha) => `[smoke] ${linha}`).join('\n'))
    test
      .info()
      .annotations.push({ type: 'cadeia', description: cadeia.join(' | ') })
  }
})
