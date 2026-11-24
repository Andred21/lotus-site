# CONTEXT.md — vocabulário do lotus-site

Glossário de domínio. Termo entra aqui quando o código passa a usá-lo como conceito próprio, não
antes.

## Contact intake

O módulo `src/integrations/contact/intake.ts`. Recebe a submissão crua do formulário como
`FormData`, normaliza, valida pelo schema de `src/lib/contact-schema.ts` e entrega à porta.
Devolve `sent`, `invalid` com erro por campo, ou `failed` genérico. Executa o schema junto da
função (`lambda/contato/handler.ts` também o executa — `src/lib/contact-schema.ts` documenta os
dois executores) e não conhece o provedor.

## Porta

O tipo `ContactSender`, declarado pelo Contact intake. Descreve o que o intake precisa de um
serviço de entrega — receber uma `ContactMessage` e responder `sent` ou `failed` — sem dizer quem
entrega. A feature depende da porta, nunca do adapter.

## Adapter

A implementação concreta de uma porta contra um provedor externo.
`src/` tem dois adapters, e só neles há `fetch`: `createApiContactoSender` em
`src/integrations/contact/api-contacto.ts` faz `POST` para `/api/contacto`, mesma origem, servida
pela distribuição do CloudFront à Lambda; `createCertificadosApi` em
`src/integrations/certificados/api-certificados.ts` consulta a API pública de certificados do Lotus.
(A Lambda em `lambda/contato/` também tem um `fetch`, para o `siteverify` do Cloudflare — não é de
`src/`.) Detalhe do provedor — código HTTP, corpo da resposta, mensagem de erro — morre dentro dele: quem
chama recebe `sent` ou `failed`, nada mais.

## Consulta

Pedido de validação por código e RUT: `POST /consulta` da API pública de certificados. É o único
pedido que leva o RUT, e só no corpo.

## Validação pelo QR

Abertura de `/validar/<uuid>`: `GET` por uuid, sem RUT, fora do limite de falhas da consulta.
