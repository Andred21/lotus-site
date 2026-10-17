// O que a zona de lotusotec.cl precisa conter, e como ler isso de volta de
// `infra/lotus-dns.yaml`. A leitura do template é a de `template.mjs`, sobre o
// leitor de YAML de `yaml.mjs`: os RecordSets são conferidos como conjunto
// fechado, e campo desconhecido quebra ruidosamente com o nome dele, nunca em
// silêncio. A validação estrutural do YAML fica com
// `aws cloudformation validate-template`, no runbook.
import {
  conferirChaves,
  escalar,
  lerTemplate,
  lista,
  recurso,
  resolver,
} from './template.mjs'
import { mapa } from './yaml.mjs'

/**
 * @typedef {{ nome: string, tipo: string, valores: string[], alias?: boolean }} RegistroEsperado
 * @typedef {{ nome: string, tipo: string, ttl: number, valores: string[], alias: boolean }} RegistroLido
 */

/**
 * Inventário fechado da zona, transcrito do painel do StackCP em 2026-09-20
 * e registrado em `docs/infra/zona-dns-lotusotec.md`. Nomes com ponto final,
 * como o Route 53 os guarda.
 *
 * A fonte deixou de ser a sondagem por DNS de 2026-09-09, que não podia
 * enxergar nome que ninguém adivinhasse: com wildcard na zona, todo palpite
 * responde. Foi essa cegueira que escondeu `pop3` — `pop` foi sondado,
 * devolveu o IP do apex e foi lido como wildcard falando; `pop3` nunca foi
 * perguntado.
 *
 * `www` está aqui por prova, não por precaução: o painel mostrava que ele
 * não era registro do outro lado e só resolvia por causa do wildcard, que
 * não atravessou a delegação. O `AAAA` dele existe pelo mesmo motivo: o
 * wildcard do painel tinha `A` **e** `AAAA`. `sistema` nasceu do mesmo jeito
 * e saiu em `B5` (spec de `7.2.5`, D2): o nome da intranet é `app`.
 *
 * Apex e `www`, `A` e `AAAA`, são alias da distribuição desde o corte
 * (`B5`, spec de `7.2.5`, §4.3): o valor é o domínio dela, e o IP que cada
 * resolvedor recebe varia.
 *
 * Os seis registros do SES foram acrescentados em `B2`, com os tokens lidos
 * dos outputs do stack `lotus-contato`.
 * @type {readonly RegistroEsperado[]}
 */
export const INVENTARIO = Object.freeze([
  {
    nome: 'lotusotec.cl.',
    tipo: 'A',
    valores: ['dhpoztt69jydz.cloudfront.net'],
    alias: true,
  },
  {
    nome: 'lotusotec.cl.',
    tipo: 'AAAA',
    valores: ['dhpoztt69jydz.cloudfront.net'],
    alias: true,
  },
  {
    nome: 'lotusotec.cl.',
    tipo: 'MX',
    valores: [
      '1 ASPMX.L.GOOGLE.COM.',
      '5 ALT1.ASPMX.L.GOOGLE.COM.',
      '5 ALT2.ASPMX.L.GOOGLE.COM.',
      '10 ALT3.ASPMX.L.GOOGLE.COM.',
      '10 ALT4.ASPMX.L.GOOGLE.COM.',
    ],
  },
  {
    nome: 'lotusotec.cl.',
    tipo: 'TXT',
    valores: [
      '"v=spf1 include:_spf.google.com include:spf.stackmail.com -all"',
    ],
  },
  {
    nome: 'www.lotusotec.cl.',
    tipo: 'A',
    valores: ['dhpoztt69jydz.cloudfront.net'],
    alias: true,
  },
  {
    nome: 'www.lotusotec.cl.',
    tipo: 'AAAA',
    valores: ['dhpoztt69jydz.cloudfront.net'],
    alias: true,
  },
  {
    nome: 'mail.lotusotec.cl.',
    tipo: 'CNAME',
    valores: ['ghs.googlehosted.com.'],
  },
  {
    nome: 'smtp.lotusotec.cl.',
    tipo: 'CNAME',
    valores: ['smtp.stackmail.com.'],
  },
  {
    nome: 'imap.lotusotec.cl.',
    tipo: 'CNAME',
    valores: ['imap.stackmail.com.'],
  },
  {
    nome: 'pop3.lotusotec.cl.',
    tipo: 'CNAME',
    valores: ['pop3.stackmail.com.'],
  },
  {
    nome: 'autodiscover.lotusotec.cl.',
    tipo: 'CNAME',
    valores: ['autodiscover.stackmail.com.'],
  },
  {
    nome: 'ftp.lotusotec.cl.',
    tipo: 'CNAME',
    valores: ['ftp.us.stackcp.com.'],
  },
  // ── SES (bloco B2), publicados em 2026-09-26 ────────────────────────────
  {
    nome: 'whkczrifauntvx6dy3r5uwx4g7w2p4p2._domainkey.lotusotec.cl.',
    tipo: 'CNAME',
    valores: ['whkczrifauntvx6dy3r5uwx4g7w2p4p2.dkim.amazonses.com.'],
  },
  {
    nome: 'veys5msb7mgj6vstojj4pmsnfs5htq5g._domainkey.lotusotec.cl.',
    tipo: 'CNAME',
    valores: ['veys5msb7mgj6vstojj4pmsnfs5htq5g.dkim.amazonses.com.'],
  },
  {
    nome: 'ilecjqmzurmfbtcete7ip5sdurjx6irz._domainkey.lotusotec.cl.',
    tipo: 'CNAME',
    valores: ['ilecjqmzurmfbtcete7ip5sdurjx6irz.dkim.amazonses.com.'],
  },
  {
    nome: 'ses.lotusotec.cl.',
    tipo: 'MX',
    valores: ['10 feedback-smtp.sa-east-1.amazonses.com.'],
  },
  {
    nome: 'ses.lotusotec.cl.',
    tipo: 'TXT',
    valores: ['"v=spf1 include:amazonses.com ~all"'],
  },
  {
    nome: '_dmarc.lotusotec.cl.',
    tipo: 'TXT',
    valores: ['"v=DMARC1; p=none; rua=mailto:contacto@lotusotec.cl"'],
  },
  // ── Intranet do Lotus (item 32 do repo lotus-infra) ─────────────────────
  // Nasce no Route 53: nunca existiu no painel. Sem AAAA, o EIP não tem IPv6.
  { nome: 'app.lotusotec.cl.', tipo: 'A', valores: ['18.230.53.197'] },
])

/**
 * Os endereços antigos do WordPress na BlueHosting, medidos em 2026-09-09.
 * Desde `B7` (7.2.7) não há WordPress neles; ficam para `respondeComoBorda`
 * reconhecer um resolvedor que ainda devolve a resposta de antes do corte.
 */
export const WORDPRESS = Object.freeze({
  A: '185.146.167.195',
  AAAA: '2a07:7800::195',
})

/**
 * Os quatro registros que o corte trocou: apex e `www`, `A` e `AAAA`
 * (spec §4.3).
 * @param {{ nome: string, tipo: string }} registro
 */
export function eDoCorte(registro) {
  return (
    ['lotusotec.cl.', 'www.lotusotec.cl.'].includes(registro.nome) &&
    ['A', 'AAAA'].includes(registro.tipo)
  )
}

/**
 * A catraca do corte (7.2.5, spec §4.3): exatamente apex e `www`, `A` e
 * `AAAA`, são alias, e alias não declara TTL — a AWS fixa em 60 s. Para onde
 * eles apontam é a conferência por linha do `INVENTARIO`. Vazio quando
 * confere; senão um problema por registro.
 * @param {readonly RegistroLido[]} registros
 * @returns {string[]}
 */
export function conferirAliasesDoCorte(registros) {
  /** @type {string[]} */
  const problemas = []
  for (const registro of registros) {
    const chave = `${registro.tipo} ${registro.nome}`
    if (registro.alias && !eDoCorte(registro)) {
      problemas.push(`alias fora de apex e www: ${chave}`)
    }
    if (!registro.alias && eDoCorte(registro)) {
      problemas.push(`sem alias: ${chave}`)
    }
    if (registro.alias && registro.ttl !== 0) {
      problemas.push(`TTL em alias: ${chave}`)
    }
  }
  return problemas
}

/**
 * Nomes que só respondiam, antes de 2026-09-26, porque o wildcard existia na
 * StackDNS (`D-45`, medido em 2026-09-09). No modo padrão (antes da troca),
 * os dois lados divergirem neles é a prova de que o wildcard não
 * atravessou — a única divergência esperada da conferência. Desde a troca,
 * no modo `--pos-delegacao`, o esperado é não resolver em lado nenhum
 * (`wildcardAusente`).
 * @type {readonly string[]}
 */
export const NOMES_INVENTADOS = Object.freeze([
  'zzz-nao-existe-19283.lotusotec.cl.',
  'outro-teste-aleatorio-77.lotusotec.cl.',
])

/**
 * A delegação que o registro `.cl` apontava antes de 2026-09-26, medida em
 * 2026-09-09. Conjunto exato, e não substring: `every` sobre lista vazia
 * devolve `true`, e uma resposta DoH sem `Answer` passaria por delegação
 * intacta. Desde a troca, `delegacaoEsperada` só usa esta lista no modo
 * padrão (o "antes"); no modo `--pos-delegacao` o esperado são os
 * nameservers do próprio stack, não esta constante.
 * @type {readonly string[]}
 */
export const NS_DA_STACKDNS = Object.freeze([
  'ns1.stackdns.com.',
  'ns2.stackdns.com.',
  'ns3.stackdns.com.',
  'ns4.stackdns.com.',
])

/**
 * Lê os `RecordSet` do template, com `!Ref` e `!Sub` já resolvidos. Cada item
 * é conjunto fechado: campo fora dele é erro com o nome do campo, nunca
 * registro lido pela metade. `AliasTarget` é o alias para o CloudFront
 * (spec §4.4): o `DNSName` vira o valor, e não há TTL — a AWS fixa em 60 s.
 * @param {string} texto
 * @returns {RegistroLido[]}
 */
export function lerRegistros(texto) {
  const template = lerTemplate(texto)
  const { defaults } = template
  const propriedades = mapa(
    recurso(template, 'Registros').Properties,
    'Registros.Properties',
  )
  return lista(propriedades.RecordSets, 'RecordSets').map((bruto, i) => {
    const caminho = `RecordSets.${i}`
    const item = mapa(bruto, caminho)
    const nome = resolver(item.Name, defaults, `${caminho}.Name`)
    conferirChaves(
      item,
      ['Name', 'Type', 'TTL', 'ResourceRecords', 'AliasTarget'],
      `RecordSet ${nome}`,
    )
    const tipo =
      item.Type === undefined
        ? ''
        : resolver(item.Type, defaults, `${caminho}.Type`)
    const ttl =
      item.TTL === undefined
        ? 0
        : Number(resolver(item.TTL, defaults, `${caminho}.TTL`))
    if (item.AliasTarget !== undefined) {
      const alvo = mapa(item.AliasTarget, `${caminho}.AliasTarget`)
      conferirChaves(
        alvo,
        ['DNSName', 'HostedZoneId', 'EvaluateTargetHealth'],
        `AliasTarget de ${nome}`,
      )
      const valor = resolver(alvo.DNSName, defaults, `${caminho}.DNSName`)
      return { nome, tipo, ttl, valores: [valor], alias: true }
    }
    const valores =
      item.ResourceRecords === undefined
        ? []
        : lista(item.ResourceRecords, `${caminho}.ResourceRecords`).map(
            (valor, j) =>
              resolver(valor, defaults, `${caminho}.ResourceRecords.${j}`),
          )
    return { nome, tipo, ttl, valores, alias: false }
  })
}

/**
 * As duas políticas de um recurso de `Resources:`, `''` quando ausentes. Para
 * `Zona`, apagar e recriar dá nameservers novos, e são eles que o registrador
 * aponta. Para `Registros`, um delete-stack sem Retain esvazia a zona viva
 * (D-52).
 * @param {string} texto
 * @param {string} nome nome lógico, como está no template
 */
export function lerPoliticasDoRecurso(texto, nome) {
  const lido = recurso(lerTemplate(texto), nome)
  /** @param {string} campo */
  const politica = (campo) =>
    lido[campo] === undefined ? '' : escalar(lido[campo], `${nome}.${campo}`)
  return {
    deletionPolicy: politica('DeletionPolicy'),
    updateReplacePolicy: politica('UpdateReplacePolicy'),
  }
}

/**
 * Mantida pelo nome: é a chamada que o teste e o `conferir-zona` já fazem.
 * @param {string} texto
 */
export function lerPoliticasDaZona(texto) {
  return lerPoliticasDoRecurso(texto, 'Zona')
}

/**
 * TXT chega com aspas de um lado e sem do outro; MX e CNAME chegam com caixa
 * variável. Normalizar aqui é o que evita falso positivo na comparação.
 * @param {string} valor
 */
export function normalizar(valor) {
  const cru = valor.trim()
  const interno = cru.match(/^(['"])([\s\S]*)\1$/)?.[2] ?? cru
  return interno.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * @param {string[]} a
 * @param {string[]} b
 */
export function mesmoConjunto(a, b) {
  /** @param {string[]} lista */
  const chaves = (lista) => [...new Set(lista.map(normalizar))].sort()
  const esquerda = chaves(a)
  const direita = chaves(b)
  return (
    esquerda.length === direita.length &&
    esquerda.every((valor, i) => valor === direita[i])
  )
}

/**
 * Veredito da linha de nome inventado, que a delegação inverte.
 *
 * Antes da troca os dois lados são zonas diferentes, e a prova de que o
 * wildcard não atravessou é a assimetria: vazio na AWS, IP na StackDNS.
 * Depois da troca os dois lados são a MESMA zona lida por caminhos
 * diferentes, e essa assimetria deixa de ser possível — o único desfecho
 * correto passa a ser vazio dos dois lados. Manter a regra antiga daria
 * vermelho justamente quando tudo estivesse certo.
 *
 * Resolver na AWS reprova nos dois casos: é o wildcard tendo atravessado.
 * @param {string[]} naAws
 * @param {string[]} naStack
 * @param {boolean} posDelegacao
 */
export function wildcardAusente(naAws, naStack, posDelegacao) {
  if (naAws.length > 0) return false
  return posDelegacao ? naStack.length === 0 : naStack.length > 0
}

/**
 * Qual delegação o relatório espera encontrar. Depois da troca ela é a do
 * próprio stack, e não uma lista fixa: uma hosted zone recriada ganha
 * nameservers novos, e uma constante aqui viraria mentira silenciosa na
 * primeira vez que isso acontecesse.
 * @param {string[]} nomesDeServidor
 * @param {boolean} posDelegacao
 * @returns {string[]}
 */
export function delegacaoEsperada(nomesDeServidor, posDelegacao) {
  if (!posDelegacao) return [...NS_DA_STACKDNS]
  return nomesDeServidor.map((nome) => `${nome.replace(/\.$/, '')}.`)
}

/**
 * Veredito de uma consulta do `medir-propagacao.mjs` (spec §4.4): o
 * resolvedor convergiu quando A **e** AAAA já dizem o esperado. Parcial —
 * um tipo trocado e o outro não — não é convergência: o visitante
 * dual-stack ainda pode cair no lado errado.
 * @param {'cloudfront' | 'ausente'} esperado
 * @param {{ A: string[], AAAA: string[] }} respostas vazio = sem resposta
 */
export function convergiu(esperado, respostas) {
  const { A, AAAA } = respostas
  switch (esperado) {
    case 'cloudfront':
      // Resposta nos dois tipos (IPV6Enabled), nenhuma do WordPress.
      return respondeComoBorda('A', A) && respondeComoBorda('AAAA', AAAA)
    case 'ausente':
      return A.length === 0 && AAAA.length === 0
    default:
      throw new Error(`esperado desconhecido: ${String(esperado)}`)
  }
}

/**
 * Resposta de um alias da distribuição (7.2.5, spec §4.5): não vazia e sem
 * o endereço do WordPress daquele tipo. O IP da borda varia por resolvedor e
 * por nameserver, então é só isso que dá para afirmar dele.
 * @param {'A' | 'AAAA'} tipo
 * @param {string[]} valores
 */
export function respondeComoBorda(tipo, valores) {
  return (
    valores.length > 0 &&
    !valores.map(normalizar).includes(normalizar(WORDPRESS[tipo]))
  )
}

/**
 * @param {string} tipo
 * @returns {'A' | 'AAAA'}
 */
function tipoDeAlias(tipo) {
  if (tipo !== 'A' && tipo !== 'AAAA') {
    throw new Error(`alias para o CloudFront só existe em A e AAAA: ${tipo}`)
  }
  return tipo
}

/**
 * O lado AWS de uma linha, a partir da resposta de cada nameserver do Route
 * 53. Registro comum: os quatro dão o mesmo conjunto, e discordar lança — é
 * a zona servida de dois jeitos. Alias: cada nameserver resolve a borda por
 * conta própria; no estágio 2 do ensaio de `B4` os quatro deram o mesmo
 * IPv4 e IPv6 diferentes (evidência §3.2). O que precisa valer em todos é
 * responder como borda: a coluna mostra a união, ou a primeira resposta que
 * não responde, para a linha reprovar mostrando o motivo.
 * @param {RegistroEsperado} registro
 * @param {string[][]} respostas uma por nameserver
 * @returns {string[]}
 */
export function respostaDosNameservers(registro, respostas) {
  if (registro.alias) {
    const tipo = tipoDeAlias(registro.tipo)
    const falha = respostas.find(
      (resposta) => !respondeComoBorda(tipo, resposta),
    )
    return falha ?? [...new Set(respostas.flat())]
  }
  const primeira = respostas[0] ?? []
  if (!respostas.every((resposta) => mesmoConjunto(resposta, primeira))) {
    throw new Error(
      `os nameservers da AWS discordam entre si em ${registro.tipo} ${registro.nome}`,
    )
  }
  return primeira
}

/** @param {string[]} valores */
const semPontoFinal = (valores) =>
  valores.map((valor) => valor.replace(/\.$/, ''))

/**
 * Veredito de uma linha do `INVENTARIO` no `conferir-zona` (spec §4.5).
 * Registro comum: inventário, AWS e servido com o mesmo conjunto. Alias: os
 * dois lados respondendo como borda — exceto quando o lado AWS veio da API
 * (`pelaApi`), em que ele é o `DNSName` da configuração e se compara com o
 * do inventário, com ou sem o ponto final.
 * @param {RegistroEsperado} registro
 * @param {string[]} naAws
 * @param {string[]} servido
 * @param {boolean} pelaApi
 */
export function linhaConfere(registro, naAws, servido, pelaApi) {
  if (!registro.alias) {
    return (
      mesmoConjunto(naAws, servido) &&
      mesmoConjunto(naAws, [...registro.valores])
    )
  }
  const tipo = tipoDeAlias(registro.tipo)
  const ladoAws = pelaApi
    ? mesmoConjunto(semPontoFinal(naAws), semPontoFinal([...registro.valores]))
    : respondeComoBorda(tipo, naAws)
  return ladoAws && respondeComoBorda(tipo, servido)
}

/**
 * Os valores de um `ResourceRecordSet` de `aws route53
 * list-resource-record-sets`: o `DNSName` quando é alias (spec §4.5), senão
 * os `ResourceRecords`.
 * @param {{ ResourceRecords?: { Value: string }[], AliasTarget?: { DNSName: string } }} conjunto
 * @returns {string[]}
 */
export function valoresDaApi(conjunto) {
  if (conjunto.AliasTarget) return [conjunto.AliasTarget.DNSName]
  return (conjunto.ResourceRecords ?? []).map((registro) => registro.Value)
}
