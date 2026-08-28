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
| retenção da mensagem | fontes oficiais em conflito (seção própria)                                                                      | armazena submissões no painel — não verificado |
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

## Retenção da mensagem — fontes oficiais em conflito

Achado `R-3` da review de 2026-08-28. Duas páginas do próprio provedor dizem coisas opostas:

- `https://docs.web3forms.com/getting-started/faq.md`, lida em 2026-08-28: "We do not store any
  form submissions of our users. We process them and forward to your email or the endpoint you
  specified such as webhooks."
- `https://web3forms.com/pricing` devolve `HTTP 403` a leitura direta, mas o texto indexado da
  página, lido por busca em 2026-08-28, anuncia o contrário: submissão armazenada por 30 dias no
  plano grátis e 1 ano no Pro, apagada automaticamente depois do período.
- A documentação técnica (`https://docs.web3forms.com/llms-full.txt`, lida em 2026-08-28) não
  menciona retenção nem histórico de submissões em lugar nenhum.

Efeito na decisão: **"não armazena" deixa de ser fato confirmado** e vira pendência a verificar na
conta, quando ela existir (`D-17`). A escolha do provedor não depende disso — o formulário coleta
nome, e-mail, empresa e mensagem, sem dado sensível —, mas a comparação muda: retenção sai da lista
de motivos para descartar a Formspree.

## Autenticação de domínio e remetente

Aceite da `4.1.6`. O e-mail entregue **não sai de `lotusotec.cl`**: sai da infraestrutura do
provedor. A documentação instrui a adicionar `notify@web3forms.com` aos contatos e `web3forms.com`
à lista de remetentes seguros, e descreve o endereço real como `notify+{hash}@web3forms.com`
(`llms-full.txt`, lida em 2026-08-28).

- **Não há registro DNS a publicar em `lotusotec.cl` por causa deste formulário.** SPF, DKIM e
  DMARC do envio são do domínio do provedor. Busca por `spf`, `dkim`, `dmarc` e `smtp` em
  `llms-full.txt` não retorna nada: SMTP próprio, verificação de domínio e envio a partir do
  domínio do cliente não são recursos documentados do Web3Forms, em nenhum plano.
- `from_name` só troca o nome de exibição — o padrão é "Notifications" e o adapter manda
  `Lotus OTEC`. Não é endereço remetente e não muda autenticação.
- `replyto` é, por padrão, o e-mail de quem preencheu: a resposta vai para a pessoa, não para o
  provedor.
- **"Restrict to Domain" é outra coisa.** Limita de quais domínios a access key pode postar — é
  autorização de origem, não autenticação de remetente — e é recurso Pro ("This is a PRO feature.
  You must have an active subscription to use this feature."). Enquanto for paga, qualquer origem
  pode postar com a chave, que é pública por design (D8 da spec).
- Risco que sobra: entregabilidade depende da reputação do domínio do provedor. Antes do go-live,
  `contacto@lotusotec.cl` precisa liberar `notify@web3forms.com` e conferir a pasta de spam na
  primeira mensagem real — mesmo gatilho de `D-17`.

Se o requisito virar "o e-mail precisa sair de `@lotusotec.cl`, autenticado por SPF/DKIM no DNS da
Lotus", o Web3Forms não atende como documentado hoje e a decisão volta à mesa.

O honeypot do clone não é o do provedor: `botcheck` é um campo de texto do próprio formulário,
validado pelo schema de `src/lib/contact-schema.ts` **antes** de qualquer requisição. Preenchido, o
envio morre no serviço e nenhuma chamada sai — a depreciação do recurso homônimo do Web3Forms não
afeta o bloco.

## Alternativas descartadas

- **Backend próprio ou função serverless** — sem decisão de hospedagem até o Sprint 6
  (`7.1.1`/`ADR-SITE-003`); criar runtime aqui anteciparia arquitetura sem necessidade.
- **Formspree** — plano grátis menor (50 contra 250 envios/mês, nenhum dos dois verificado em
  2026-08-28). A retenção deixou de pesar nesta comparação: ver a seção sobre retenção.
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
- A retenção da mensagem no provedor não está resolvida (seção própria); `D-17` cobre a
  verificação na conta.
- O teto mensal do plano grátis não está verificado. Antes do go-live, confirmar o número na conta
  criada — se 250 envios/mês estiver errado, a escolha continua válida mas o gatilho de upgrade
  muda.

## Pendente

Não existe conta Web3Forms nesta rodada (decisão de João em 2026-08-27). O adapter está provado
contra a API documentada, com `fetch` duplicado no teste unitário e rota interceptada no E2E; o
envio real contra o serviço **não** foi executado nem é afirmado. Débito `D-17`.
