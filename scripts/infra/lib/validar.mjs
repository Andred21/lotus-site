// A tabela única de D11 (spec §5.1): que URI a borda reescreve para a página
// de validação e quais ela deixa passar. A catraca da borda
// (`distribuicao.mjs`, que roda a função do template em `node:vm`) e o teste
// do plugin de dev/preview do Vite leem daqui, para os dois lados nunca
// divergirem. A razão da reescrita é a ADR-SITE-007.

/** O único arquivo que a reescrita serve. */
export const DESTINO_DA_VALIDACAO = '/validar/index.html'

/** Um uuid v4 válido, em minúsculas, para os casos. */
export const UUID_DE_EXEMPLO = '0f8fad5b-d9cb-469f-a165-70867728950e'

const U = UUID_DE_EXEMPLO
const D = DESTINO_DA_VALIDACAO

/**
 * `vira` é o `uri` que o pedido tem depois da função; igual a `uri` quando a
 * borda não reescreve.
 * @type {readonly { nome: string, uri: string, vira: string }[]}
 */
export const CASOS_DA_VALIDACAO = Object.freeze(
  [
    { nome: 'formulário sem barra', uri: '/validar', vira: D },
    { nome: 'formulário com barra', uri: '/validar/', vira: D },
    { nome: 'QR', uri: `/validar/${U}`, vira: D },
    { nome: 'QR em maiúsculas', uri: `/validar/${U.toUpperCase()}`, vira: D },
    { nome: 'arquivo direto', uri: '/validar/index.html', vira: D },
    { nome: 'não é uuid', uri: '/validar/abc' },
    {
      nome: 'uuid sem hífen',
      uri: '/validar/0f8fad5bd9cb469fa16570867728950e',
    },
    { nome: 'uuid curto', uri: `/validar/${U.slice(0, -1)}` },
    { nome: 'uuid com barra final', uri: `/validar/${U}/` },
    { nome: 'abaixo do uuid', uri: `/validar/${U}/x` },
    { nome: 'prefixo parecido', uri: '/validarx' },
    { nome: 'prefixo em maiúsculas', uri: '/VALIDAR' },
    { nome: 'raiz', uri: '/' },
    { nome: 'home', uri: '/index.html' },
    { nome: 'release', uri: `/releases/abc123/validar/${U}` },
  ].map((caso) => Object.freeze({ vira: caso.uri, ...caso })),
)
