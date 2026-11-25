# Evidência — validação de certificado em produção (A8)

Bloco `B12 · validacao-certificado`, spec
`docs/superpowers/specs/2026-11-24-validacao-certificado-design.md`, D13 e §8 (A8). Fecha a
PENDÊNCIA 8 do backlog. A prova contra o stack local do Lotus (A7) está em
[`evidencia-validacao-certificado-2026-11-24.md`](evidencia-validacao-certificado-2026-11-24.md).

Todos os passos são de 2026-11-25. Os comandos foram executados; nada foi preenchido de memória.

## 1. D13 passo 1 — a API do Lotus em produção

Medido por Claude antes do change set, contra
`https://app.lotusotec.cl/api/publico/certificados/consulta`:

- `GET` → `405`.
- `OPTIONS` com `Origin: https://lotusotec.cl`, `Access-Control-Request-Method: POST` e
  `Access-Control-Request-Headers: content-type` → `204`, com
  `access-control-allow-origin: https://lotusotec.cl` e sem `Access-Control-Allow-Credentials`.

Antes do change set, a CSP servida em `https://lotusotec.cl/` tinha `connect-src 'self'`. Se o
merge tivesse vindo antes, a página seria bloqueada pelo navegador, e por isso o passo 2 veio
primeiro.

## 2. D13 passo 2 — change set de `infra/lotus-site.yaml`

- **Change set:**
  `arn:aws:cloudformation:sa-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1795617692/3d6ecb9f-bf37-401a-8ae4-6982507883be`.
  João o criou com `deploy --no-execute-changeset` a partir de `feat/validacao-certificado` em
  `9e09c6d`. Os oito parâmetros ficaram com os valores do stack, sem `--parameter-overrides`.
- **Linhas lidas por Claude antes do `execute`:** três, todas `Modify` com `Replacement: False`:
  - `PoliticaDeCabecalhos`: `ResponseHeadersPolicyConfig`, `DirectModification`.
  - `RedirecionarWww`: `FunctionConfig` e `FunctionCode`, `DirectModification`.
  - `Distribuicao`: `DistributionConfig`, `ResourceAttribute`/`Dynamic`, ou seja, só a referência à
    função alterada.

  Não houve `Add`, `Remove` nem substituição.

- **Execução:** feita por João. O stack ficou `UPDATE_COMPLETE`, com `LastUpdatedTime`
  2026-11-25T14:43:04Z.
- **Conferência depois do update (antes do merge):**
  - A CSP em `/` passou a ter `connect-src 'self' https://app.lotusotec.cl`.
  - `/` respondeu `200`.
  - `/validar/abc` e `/validar/<uuid>` responderam `404`, porque a reescrita apontava para um
    `validar/index.html` que ainda não estava no bucket.
  - `https://www.lotusotec.cl/cursos?a=1` respondeu `301` para
    `https://lotusotec.cl/cursos?a=1`.

## 3. D13 passo 3 — merge, espelho e deploy

- **PR #34:** mesclado por João em 2026-11-25T14:55:36Z, com o commit de merge `c531c1a`.
- **CI da origem** em `c531c1a`, verde: run `45639407714`.
- **Espelho:** `scripts/espelhar-corporativo.sh`, executado por João. Gerou o release `5fb34c9`
  em `Gatika-CL/lotus-site`, com `Source-Commit: c531c1a…`.
- **CI do corporativo:** run `45640504784`, de 15:01:41Z a 15:08:28Z. `check`, `procedencia` e
  `deploy` passaram; `alerta` foi pulado.

## 4. D13 passo 4 — A8 em produção

**API e rotas.** Medido por Claude depois do deploy:

| Item                                                       | Resultado                                                 |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| `GET /consulta`                                            | `405`                                                     |
| Preflight com `Origin: https://lotusotec.cl`               | `204`, esse `Allow-Origin`, sem `Allow-Credentials`       |
| `/validar` e `/validar/`                                   | `200`, `<title>Validar certificado \| LOTUS OTEC</title>` |
| `/validar/123e4567-e89b-42d3-a456-426614174000` (fictício) | `200`, a página                                           |
| `/validar/abc`                                             | `404`                                                     |
| "Validar Certificado" no menu                              | presente no bundle servido em `/`                         |

**Smoke de produção.** `SMOKE_URL=https://lotusotec.cl pnpm smoke` deu **14 passed**. O item 1
confirmou que o artefato no ar é o release `5fb34c95420bdb29e477bd5ec23060f58f854a50`.

| Item | O que confere                                             |
| ---- | --------------------------------------------------------- |
| 5    | assets                                                    |
| 8    | cabeçalhos com a CSP nova                                 |
| 9    | `404` em `/validar/abc` e em `/validar/<uuid>/x`          |
| 10   | `/validar` e `/validar/<uuid>` com `no-cache` e `noindex` |

Os outros itens (artefato, TLS, redirects, home, formulário de contato e SEO) também passaram. O
item 6 só envia corpos inválidos e espera `400`; nenhum e-mail sai.

**Certificado real.** Prova feita por João no navegador, com capturas mostradas na sessão, sobre
um certificado emitido pelo Lotus em produção: registro `LOT-2026-125`. Nome e RUT do aluno ficam
fora deste registro de propósito, porque o repositório é espelhado no corporativo.

- **Formulário:** a consulta por número de registro e RUT devolveu "Vigente" e "Certificado
  válido", com o curso, o término e o "Válido hasta".
- **Abertura direta:** `/validar/<uuid>`, o caminho do QR, abriu o mesmo resultado sem o
  formulário, com "Descargar PDF" e "Validar otro certificado".
- **PDF:** "Descargar PDF" baixou o arquivo, confirmado por João.

## 5. Resultado

A8 está provado, e com ele a PENDÊNCIA 8 se fecha. Falta só o aviso à sessão do Lotus de que a
página está pronta para a ficha 63. Esse aviso não muda nada neste repositório.
