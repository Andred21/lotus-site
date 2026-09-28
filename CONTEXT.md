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
`createApiContactoSender` em `src/integrations/contact/api-contacto.ts` é o único adapter de
`src/` e o único lugar de `src/` com `fetch`: faz `POST` para `/api/contacto`, mesma origem,
servida pela distribuição do CloudFront à Lambda. (A Lambda em `lambda/contato/` também tem um
`fetch`, para o `siteverify` do Cloudflare — não é o único `fetch` do repositório, só de `src/`.)
Detalhe do provedor — código HTTP, corpo da resposta, mensagem de erro — morre dentro dele: quem
chama recebe `sent` ou `failed`, nada mais.
