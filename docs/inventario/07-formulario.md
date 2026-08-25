# 07 — Contrato do formulário de contato

> Evidência: `docs/inventario/dom.json` (`forms[0]`), capturado em `2026-08-25T19:04:12.421Z`. Commit-base: `8f765b0`. **O formulário nunca foi submetido** — decisão D5 da spec. Tudo abaixo vem de ler atributos do DOM estático, sem clicar em "Enviar".

## Observado

| campo                    | `name`                                    | `type`     | placeholder (rótulo visível) | `required` |
| ------------------------ | ----------------------------------------- | ---------- | ---------------------------- | ---------- |
| Nome                     | `et_pb_contact_name_0`                    | `text`     | `Nombre Completo`            | `false`    |
| Email                    | `et_pb_contact_email_0`                   | `text`     | `Correo Electrónico`         | `false`    |
| Empresa                  | `et_pb_contact_company_0`                 | `text`     | `Empresa`                    | `false`    |
| Mensagem                 | `et_pb_contact_message_0`                 | `textarea` | `Mensaje`                    | `false`    |
| (oculto) flag de envio   | `et_pb_contactform_submit_0`              | `hidden`   | —                            | `false`    |
| (oculto) nonce WordPress | `_wpnonce-et-pb-contact-form-submitted-0` | `hidden`   | —                            | `false`    |
| (oculto) referer         | `_wp_http_referer`                        | `hidden`   | —                            | `false`    |

- `<form action="https://lotusotec.cl/" method="post">` — o form posta de volta para a própria home, não para um endpoint separado.
- Texto do botão: `Enviar`.
- Plugin responsável: módulo nativo **Contact Form do Divi Builder** (nomes de campo `et_pb_contact_*`, nonce `_wpnonce-et-pb-contact-form-submitted-0`) — não é Contact Form 7 nem outro plugin de terceiros.
- **Nenhum campo tem `required` no HTML.** Se existe validação de campo obrigatório hoje, ela não está no atributo — seria server-side (PHP do Divi) ou inexistente. Isso é achado, não suposição.
- Rótulos visíveis são todos `placeholder`, não `<label>` — não há texto de campo que sobreviva ao usuário digitar (ver `02-conteudo.md`, seção Contato).
- Nenhum `aria-label` está presente em nenhum campo (`ariaLabel: null` em todos).

## Não observado

Como o formulário não foi submetido (decisão D5), o que segue **não foi verificado** — nem confirmado, nem descartado:

- Mensagem de sucesso após envio.
- Mensagem de erro (campo obrigatório, formato de email inválido, etc.) e se ela é client-side ou só depois do POST.
- Validação server-side real (o `required: false` no HTML não implica ausência de validação no servidor).
- Destinatário real do email (endereço de recebimento configurado no Divi, que não precisa ser `contacto@lotusotec.cl` — esse é só o email exibido como texto na seção `Contacto`, ver `02-conteudo.md`).
- Se existe qualquer proteção contra spam além do nonce do WordPress (o nonce em si só previne CSRF/replay, não spam).
- Comportamento em caso de falha de rede ou timeout do POST.

## Decisão futura

O que a Sprint 3 precisa decidir antes de implementar o formulário do clone:

- Endpoint próprio (função serverless, backend simples) vs. serviço de terceiro (Formspree, Resend, etc.) — o clone é estático (Vite), não tem PHP/WordPress por trás.
- Se mantém os 4 campos observados (`Nombre Completo`, `Correo Electrónico`, `Empresa`, `Mensaje`) ou revisita quais são obrigatórios, já que nenhum é hoje.
- Honeypot e/ou captcha, já que o nonce do WordPress não sobrevive à migração e não há substituto óbvio ainda.
- Mensagens de sucesso/erro do novo formulário — não há nada do site atual para replicar aqui, porque nunca foi observado.
