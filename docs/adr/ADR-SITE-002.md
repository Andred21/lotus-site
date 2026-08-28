# ADR-SITE-002 · Envio do formulário de contato

- **Status:** aceito
- **Data:** 2026-08-27
- **Escopo:** Sprint 3, EAP 4.1.1 a 4.1.10

## Contexto

`lotus-site` é uma SPA Vite estática: não existe servidor, função serverless ou Server Action onde
um segredo de runtime pudesse viver. O formulário do original era PHP do Divi, postava para o
próprio WordPress e nunca foi submetido durante o inventário (`07-formulario.md`, decisão D5 da
Sprint 1): não há destinatário, mensagem de sucesso nem contrato de erro observados.

A EAP do Notion descreve Server Action, serviço server-side e secret de runtime — vocabulário de
Next.js num repositório Vite. Quarta instância de `D-01`; João decidiu em 2026-08-27 que o envio é
POST direto do browser para um serviço form-to-email.

## Decisão

Web3Forms, chamado por `POST https://api.web3forms.com/submit` a partir do
adapter `src/integrations/contact/web3forms.ts`.

| critério             | Web3Forms                                                                                                        | Formspree                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| plano grátis         | 250 envios/mês — não verificado                                                                                  | 50 envios/mês — não verificado                 |
| primeiro plano pago  | não verificado em 2026-08-28                                                                                     | US$ 10/mês por 1.000 envios — não verificado   |
| chave no cliente     | pública por design (confirmado)                                                                                  | endpoint público por design — não verificado   |
| retenção da mensagem | encaminha e não armazena (confirmado)                                                                            | armazena submissões no painel — não verificado |
| servidores           | US-East (confirmado)                                                                                             | EUA — não verificado                           |
| anti-spam incluso    | firewall e checagem de spam no servidor, hCaptcha e Cloudflare Turnstile; reCaptcha só no plano Pro (confirmado) | honeypot + captcha opcional — não verificado   |
| restrição de domínio | recurso pago (confirmado)                                                                                        | recurso pago — não verificado                  |

Os números acima são o levantamento de 2026-08-27 que fundamentou a decisão de João. A reconferência
de 2026-08-28 confirmou o que está marcado como `confirmado` e **não conseguiu abrir nenhuma página
de preço**: toda célula de valor, teto mensal e comparação com Formspree fica como
`não verificado em 2026-08-28`, não como fato.

Fonte e data de cada número:

- `https://docs.web3forms.com/getting-started/faq.md`, lida em 2026-08-28 — chave pública por
  design, ausência de armazenamento das submissões ("We do not store any form submissions of our
  users. We process them and forward to your email or the endpoint you specified such as
  webhooks."), log de servidor com dado pessoal apagado a cada dois meses, servidores em US-East e
  restrição de domínio como recurso pago.
- `https://docs.web3forms.com/getting-started/api-reference.md`, lida em 2026-08-28 — endpoint
  `https://api.web3forms.com/submit`, campo obrigatório `access_key`, resposta
  `{ success: boolean, body: { data, message } }`.
- `https://docs.web3forms.com/getting-started/customizations/spam-protection.md`, lida em
  2026-08-28 — checagem de spam no servidor, hCaptcha e Turnstile disponíveis, reCaptcha só no Pro.
- `https://docs.web3forms.com/llms-full.txt`, lida em 2026-08-28 — o honeypot **do provedor** é um
  `checkbox` chamado `botcheck` e está documentado como depreciado e não recomendado.

Páginas que não abriram em 2026-08-28: `https://web3forms.com/#pricing` respondeu `HTTP 403`;
`https://formspree.io/plans`, `https://formspree.io/plans/` e `https://formspree.io/pricing`
devolveram corpo vazio.

O honeypot do clone não é o do provedor: `botcheck` é um campo de texto do próprio formulário,
validado pelo schema de `src/lib/contact-schema.ts` **antes** de qualquer requisição. Preenchido, o
envio morre no serviço e nenhuma chamada sai — a depreciação do recurso homônimo do Web3Forms não
afeta o bloco.

## Alternativas descartadas

- **Backend próprio ou função serverless** — sem decisão de hospedagem até o Sprint 6
  (`7.1.1`/`ADR-SITE-003`); criar runtime aqui anteciparia arquitetura sem necessidade.
- **Formspree** — plano grátis menor e a mensagem fica armazenada no painel do provedor.
- **`mailto:` puro** — não é envio, é abrir o cliente de e-mail do visitante; o endereço já está
  publicado acima do formulário como saída alternativa.

## Consequências

- A chave é **configuração pública**, não segredo: `VITE_WEB3FORMS_ACCESS_KEY` entra no bundle por
  definição do Vite. Segredo real continua proibido em variável `VITE_*`.
- Sem chave configurada, `src/app/App.tsx` injeta `unavailableContactSender` e o envio falha de
  forma visível, em es-CL. Sucesso nunca é simulado.
- Restrição de domínio é paga: hoje qualquer origem pode postar com a chave. O anti-spam do bloco é
  honeypot + limites de tamanho, proporcional a um site sem abuso medido (D5 da spec). Gatilho para
  revisar: spam chegando na caixa de destino depois do go-live.
- Os dados do formulário trafegam para servidores do provedor nos EUA. Nenhum dado sensível é
  coletado: nome, e-mail, empresa e mensagem.
- O teto mensal do plano grátis não está verificado. Antes do go-live, confirmar o número na conta
  criada — se 250 envios/mês estiver errado, a escolha continua válida mas o gatilho de upgrade
  muda.

## Pendente

Não existe conta Web3Forms nesta rodada (decisão de João em 2026-08-27). O adapter está provado
contra a API documentada, com `fetch` duplicado no teste unitário e rota interceptada no E2E; o
envio real contra o serviço **não** foi executado nem é afirmado. Débito `D-17`.
