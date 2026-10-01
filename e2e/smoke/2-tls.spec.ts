import { DOMINIO, WWW, expect, test } from './alvo'
import { certificadoDe } from './rede'

// Sempre contra os dois nomes reais, com SNI, no IP de `destino`: é a
// distribuição respondendo pelo domínio próprio, esteja o DNS virado ou não.
for (const nome of [DOMINIO, WWW]) {
  test(`2 · TLS de ${nome}: certificado da Amazon com os dois nomes, ≥ 30 dias, TLS ≥ 1.2`, async ({
    destino,
  }) => {
    const c = await certificadoDe(destino, nome)
    expect(c.emissor).toBe('Amazon')
    expect(c.sans).toContain(`DNS:${DOMINIO}`)
    expect(c.sans).toContain(`DNS:${WWW}`)
    expect(c.validoAte.getTime() - Date.now()).toBeGreaterThan(30 * 86_400_000)
    expect(['TLSv1.2', 'TLSv1.3']).toContain(c.protocolo)
    console.log(
      `[smoke] ${nome}: ${c.protocolo}, ${c.emissor}, válido até ${c.validoAte.toISOString()}`,
    )
  })
}
