import { DOMINIO, WWW, expect, test } from './alvo'
import { pedir } from './rede'

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

    const www = await passo(`https://${WWW}/cursos/?a=1&a=2&b=x`)
    expect(www.status).toBe(301)
    expect(www.headers.location).toBe(`https://${DOMINIO}/cursos/?a=1&a=2&b=x`)

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
