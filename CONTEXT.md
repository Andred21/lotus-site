# CONTEXT.md — vocabulário do lotus-site

Glossário de domínio. Termo entra aqui quando o código passa a usá-lo como conceito próprio, não
antes.

## Contact intake

O módulo `src/integrations/contact/intake.ts`. Recebe a submissão crua do formulário como
`FormData`, normaliza, valida pelo schema de `src/lib/contact-schema.ts` e entrega à porta.
Devolve `sent`, `invalid` com erro por campo, ou `failed` genérico. É o único executor do schema
no repositório e não conhece o provedor.

## Porta

O tipo `ContactSender`, declarado pelo Contact intake. Descreve o que o intake precisa de um
serviço de entrega — receber uma `ContactMessage` e responder `sent` ou `failed` — sem dizer quem
entrega. A feature depende da porta, nunca do adapter.

## Adapter

A implementação concreta de uma porta contra um provedor externo.
`createWeb3FormsSender` em `src/integrations/contact/web3forms.ts` é o único do repositório, e o
único lugar com `fetch`. Detalhe do provedor — código HTTP, corpo da resposta, mensagem de erro —
morre dentro dele: quem chama recebe `sent` ou `failed`, nada mais.
