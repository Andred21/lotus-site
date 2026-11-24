# Evidência — validação de certificado contra o stack local do Lotus (A7)

Work item `validacao-certificado`, spec `docs/superpowers/specs/2026-11-24-validacao-certificado-design.md`
(§8, A7), plano `docs/superpowers/plans/2026-11-24-validacao-certificado.md` (Task 11). Datas, comandos
e saídas abaixo são os executados em 2026-11-24; nada é digitado de memória.

## 1. Ambiente

| Item                 | Valor                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| Lotus                | árvore principal, `main` em `aba2b75e`; API em `http://localhost:8080`                     |
| CORS do Lotus        | `CORS_PUBLIC_ORIGINS=http://localhost:5190` no `backend/.env` (posto por João)             |
| Site                 | branch `feat/validacao-certificado` em `27a508f`                                           |
| Comando do site      | `VITE_CERTIFICADOS_API_URL=http://localhost:8080 pnpm dev --port 5190 --strictPort`        |
| Navegador            | Chromium do Playwright 1.62, por script (o João não acompanhou a tela)                     |
| Certificado vigente  | `LOT-2025-05999`, uuid `39336087-36a5-4a68-8f56-3c14bd15d5ee`, dado de seed do banco local |
| Certificado revogado | `LOT-2026-1001`, uuid `483757bf-0cd2-47be-ae4d-8a57a4fbc155`, dado de seed do banco local  |
| RUT de demonstração  | lido do `snapshot` do certificado vigente; não é escrito aqui nem foi impresso no terminal |
| RUT errado usado     | `11.111.111-1` (dígito verificador válido, diferente do RUT do aluno)                      |

O certificado de demonstração foi escolhido no banco local: o certificado `emitido` mais recente cujo
`snapshot.aluno.rut` passa em `Rut::isValid()`, a mesma condição que a API usa para comparar.

## 2. Preflight (Task 11, Step 2)

```text
$ curl -si -X OPTIONS http://localhost:8080/api/publico/certificados/consulta \
    -H 'Origin: http://localhost:5190' -H 'Access-Control-Request-Method: POST' \
    -H 'Access-Control-Request-Headers: content-type'
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5190
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: content-type, accept, accept-language
Access-Control-Max-Age: 0
```

Nenhum `Access-Control-Allow-Credentials`. `GET /api/publico/certificados/consulta` → `405`.

## 3. O que foi visto (Task 11, Step 4)

| Item                               | Pedido e status na API                   | O que a página mostrou                                                                                                                                |
| ---------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| QR do vigente                      | `GET /{uuid}` → 200                      | "Certificado válido", curso "Rescate en altura · 16 h"                                                                                                |
| PDF                                | `GET /{uuid}/pdf` → 200                  | download `certificado-LOT-2025-05999.pdf`, 304.845 B, começa com `%PDF`                                                                               |
| Código + RUT certos                | `POST /consulta` → 200                   | "Certificado válido" abaixo do formulário; URL continua `/validar`                                                                                    |
| RUT errado                         | `POST /consulta` → 404                   | "No encontramos un certificado con esos datos"                                                                                                        |
| Formato inválido                   | nenhum pedido                            | "Formato: LOT-2026-123" e "RUT inválido"; 0 pedidos novos à API                                                                                       |
| QR do revogado                     | `GET /{uuid}` → 200                      | "Certificado revocado", linhas "N° de registro" e "Revocado el", sem "DESCARGAR PDF"                                                                  |
| Consultas seguidas (10 por minuto) | 10 × `POST /consulta` → 200, a 11ª → 429 | "ESPERE · Demasiadas consultas seguidas · Intente de nuevo en 2 segundos.", VALIDAR desativado                                                        |
| Falhas seguidas (10 por RUT, hora) | 10 × `POST /consulta` → 404, a 11ª → 429 | "BLOQUEADO · La consulta por N° de registro y RUT está bloqueada · … Podrá intentar de nuevo en 60 minutos." e a orientação do QR; VALIDAR habilitado |
| QR durante o bloqueio              | `GET /{uuid}` → 200                      | "Certificado válido"                                                                                                                                  |

Em todas as fases: nenhuma URL pedida nem a URL da página contém o RUT (com pontos, sem pontos ou só
dígitos), e `localStorage`/`sessionStorage` ficaram vazios.

Notas:

- O PDF da API manda `Content-Disposition: attachment; filename="certificado-LOT-2025-05999.pdf"` e
  `Access-Control-Expose-Headers: Content-Disposition, Retry-After`. O nome coincide com o nome de
  reserva do site (`certificado-<codigo>.pdf`), então esta prova não distingue os dois; a leitura do
  header está provada no E2E (`e2e/validar.spec.ts`), com um nome diferente do de reserva.
- O modo QR fez dois `GET /{uuid}` por abertura: é o `StrictMode` do React no dev server, que monta o
  componente duas vezes. O build de produção faz um.
- A espera mostrou "2 segundos" porque as duas consultas da fase anterior já estavam na mesma janela
  de um minuto: o `Retry-After` é o que falta da janela.
- O bloqueio veio do limite por RUT (`FALHAS_CONSULTA_POR_RUT = 10`, janela de 3600 s), contando a
  falha da linha "RUT errado". O limitador fica ativo por 1 h no stack local para esse RUT errado e
  esse IP.

## 4. O que não foi provado

- O fluxo na tela com o João olhando: a prova foi por script, com capturas em
  `/tmp/claude-1000/…/scratchpad/a7-*.png` (fora do repositório).
- Os outros motores contra o stack local: só Chromium. Firefox, WebKit e iPhone 13 estão provados com
  a API simulada (`pnpm e2e`, A3).
- O bloqueio por IP (`FALHAS_CONSULTA_POR_IP = 20`): o limite por RUT disparou antes.
- Produção (A8): fica para depois de D13 passo 1.
