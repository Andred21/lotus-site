# ADR-SITE-005 · O contato passa a ser SES atrás de uma Lambda na mesma origem

- **Status:** aceito
- **Data:** 2026-09-09
- **Escopo:** bloco `B2`, EAP `4.1.7`, `7.1.3`, `7.1.4`
- **Substitui:** `ADR-SITE-002` · Envio do formulário de contato (Web3Forms), que passa a
  `superseded`.
- **Não substitui:** `ADR-SITE-003`, que continua valendo — é ela que torna esta troca barata.

## Contexto

A `ADR-SITE-002` escolheu Web3Forms em 2026-08-27 sob uma premissa explícita: a SPA é estática,
não há servidor nosso onde um segredo de runtime possa viver, então o envio é POST direto do
navegador para um serviço form-to-email.

Duas coisas mudaram desde então.

**A primeira é que o envio nunca foi provado.** Não existe conta nem access key do Web3Forms
(`D-17`, aberto desde 2026-08-27 e reafirmado em 2026-08-29). O adapter está provado contra a API
documentada — `fetch` duplicado no teste unitário, `page.route` interceptando `api.web3forms.com`
no E2E — mas nenhuma mensagem chegou a uma caixa real, e o aceite da `4.1.7` fecha como parcial
declarado até hoje.

**A segunda é que a EAP `7.1.4` pede domínio remetente autenticado**: "Domínio aparece verificado
no provedor e envio de produção não depende de remetente genérico não autenticado". Com Web3Forms
o remetente é o domínio deles. O critério não é atingível — só declarável como divergência.

Em 2026-09-09 João decidiu que toda a infraestrutura do site fica na AWS, e escolheu SES + Lambda
Function URL para o formulário.

## Decisão

```text
navegador  POST /api/contacto        (mesma origem, sem CORS)
   │
CloudFront  behavior /api/*  ──OAC, SigV4──▶  Lambda Function URL (AuthType: AWS_IAM)
                                                   │
                                              SES SendEmail
                                                   │
                                        caixa do Google Workspace
```

Quatro escolhas dentro dessa linha, cada uma com um motivo que não é estética:

**Lambda, e não SES chamado do navegador.** O SES exige credencial assinada. Navegador não guarda
credencial. Não há terceira via.

**Function URL, e não API Gateway.** O API Gateway acrescenta um serviço, uma fatura e uma segunda
borda para configurar. O CloudFront já está na frente do site e sabe rotear por path. A Function
URL é o mínimo que fecha o caminho.

**`AuthType: AWS_IAM` com OAC, e não Function URL pública.** Função pública é endpoint aberto na
internet, com o nome sorteado como única proteção. Com OAC, o CloudFront assina a chamada em SigV4
e a função recusa qualquer outra origem. A superfície pública continua sendo uma só — que é a mesma
propriedade que fez a `ADR-SITE-004` escolher S3 privado com OAC em vez de website endpoint.

**Mesma origem, e não subdomínio de API.** `/api/contacto` sob o mesmo host elimina CORS e deixa a
CSP de `B3` fechar em `connect-src 'self'`. Um `api.lotusotec.cl` custaria mais um certificado, mais
uma entrada de CSP e um preflight por envio, sem comprar nada.

## O que isso quebra da ADR-SITE-004

A `ADR-SITE-004` diz, na secção **Runtime: estático, sem servidor**, que renderização no servidor,
webhook, cron e segredo que não possa ir para o navegador exigiriam outra peça — "e essa peça
precisaria do seu próprio ADR". Este é esse ADR. O que passa a valer:

- **Existe código nosso rodando.** O modo de falha "a função quebrou" passa a existir, e não existia.
- **Existe runtime a atualizar.** Runtime gerenciado da Lambda tem fim de suporte; ignorar isso é
  como ignorar patch de sistema operacional, só que com aviso por e-mail.
- **Existe log com custo.** CloudWatch Logs cobra ingestão e retenção. Retenção precisa ser
  definida no template, não deixada em "nunca expira".
- **Existe IAM a revisar.** A role da função pode `ses:SendEmail` e nada mais.
- O resto da `ADR-SITE-004` continua de pé: o site é objeto em bucket e cache em borda, e o
  rollback dela não muda.

## SES: identidade, DKIM e MAIL FROM

- **Identidade de domínio** `lotusotec.cl`, com DKIM por Easy DKIM — três CNAME na zona do Route 53
  (`ADR-SITE-006`). É isso que fecha a `7.1.4` de verdade.
- **MAIL FROM em subdomínio próprio**, para o SPF alinhar sem tocar o apex. O subdomínio **não pode
  ser `mail.lotusotec.cl`**: esse nome já existe e é `CNAME ghs.googlehosted.com`. Usar
  `ses.lotusotec.cl`, que está livre.
- **O MX do apex não é tocado.** Ele é o Google Workspace, e o e-mail corporativo continua lá por
  decisão de João em 2026-09-09. O MX que o MAIL FROM exige é do subdomínio, para bounce.
- **DMARC não existe hoje** (`D-46`). Publicar `p=none` com relatório antes de `B2` ir ao ar é o
  jeito de enxergar o efeito do remetente novo em vez de adivinhá-lo.
- **Sandbox.** Conta de SES nova só envia para destinatário verificado, com teto de 200 mensagens
  por dia. Sair disso é ticket de suporte com espera — pedido no início de `B1`, não no meio de
  `B2`.
- **Região a confirmar.** A distribuição e o bucket estão em `sa-east-1`. Se o SES não estiver
  disponível lá, ele vai para `us-east-1` e a Lambda pode segui-lo ou chamá-lo entre regiões. Isso
  é verificação do bloco, não afirmação deste ADR.

## Antispam

O honeypot `botcheck` já existe no schema e continua. O que muda é que o alvo passa a ser nosso: um
endpoint aberto atrás do CloudFront recebe o que a internet mandar, e cada mensagem custa um envio
de SES e um registro de log.

Rate limit fica decidido no bloco, entre duas opções com custo diferente: uma CloudFront Function
contando por IP, barata e burra, ou uma regra rate-based do WAF, que cobra mensalidade fixa por
Web ACL mais a regra. Não decidir agora é deliberado — o número de envios reais do site é zero, e
dimensionar defesa sem tráfego medido é chute caro.

## Alternativas consideradas

**Manter Web3Forms.** Zero infra e zero runtime. Sai porque não fecha a `7.1.4` — o remetente é
domínio de terceiro — e porque mantém `D-17` de pé, esperando uma conta que ninguém criou em treze
dias. Além disso a `ADR-SITE-002` registra que as fontes oficiais do próprio Web3Forms se
contradizem sobre retenção da mensagem; com SES, o dado passa pela nossa conta e pela nossa região.

**SES via SMTP a partir de um serviço de formulário.** Continua dependendo de terceiro para o
caminho todo, e acrescenta credencial SMTP de longa duração — exatamente o que o OIDC do deploy
existe para não ter.

**Formspree ou equivalente.** Mesmo problema do Web3Forms, com outro nome. A comparação já foi
feita na `ADR-SITE-002` e não mudou.

## Consequências

- **A porta não muda.** `ContactSender`, em `src/integrations/contact/intake.ts`, continua sendo a
  fronteira; `web3forms.ts` sai e um adapter novo entra. É a troca que a `ADR-SITE-003` tornou
  barata ao concentrar quatro módulos em um.
- **13 arquivos citam `web3forms`** e precisam acompanhar: o adapter e seu teste, `intake.test.ts`,
  `src/app/App.tsx` e `App.test.tsx`, `ContactForm.test.tsx`, `e2e/contacto.spec.ts`,
  `e2e/a11y.spec.ts`, `e2e/teclado.spec.ts`, `.env.example`, `src/vite-env.d.ts` e as duas ADR.
- **`7.1.3` fecha por construção.** Não sobra segredo nenhum para o cliente: a credencial é a role
  da função. `VITE_WEB3FORMS_ACCESS_KEY` deixa de existir.
- **`unavailableContactSender` continua fazendo sentido** e deve continuar existindo: build
  publicado sem o endpoint configurado precisa falhar de forma visível em vez de simular sucesso.
- **`D-17` fecha por substituição**, não por conta criada.
- **O filtro do Budget precisa incluir SES e Lambda**, senão o teto de US$ 30 deixa de medir o que
  passa a existir.
- **A prova de aceite muda de natureza.** Deixa de ser "interceptei a chamada e ela tinha o formato
  certo" e passa a ser "a mensagem chegou na caixa". É a diferença entre `4.1.7` parcial e `4.1.7`
  fechada.

## Emenda E1 — 2026-09-26, bloco `4.1.7+7.1.3+7.1.4`

O corpo acima não é reescrito. O que o bloco mediu e decidiu dentro dele, com o detalhe na spec
[`2026-09-26-4.1.7-7.1.3-7.1.4-contato-ses-lambda-design.md`](../superpowers/specs/2026-09-26-4.1.7-7.1.3-7.1.4-contato-ses-lambda-design.md):

- **D1 — o POST pelo OAC exige hash do corpo calculado no navegador.** A documentação do
  CloudFront exige `x-amz-content-sha256` em `POST` a Function URL por OAC; a Lambda não aceita
  payload sem hash. O adapter calcula o SHA-256 com `crypto.subtle`, que só existe em contexto
  seguro — sem ele, `unavailableContactIntake`. A ADR não previa isso. Duas
  `AWS::Lambda::Permission` (`InvokeFunctionUrl` e `InvokeFunction`) são exigidas. Isso também
  revoga "`unavailableContactSender` continua fazendo sentido e deve continuar existindo" (≈
  127-131): esse intake nulo foi removido em `ca00638` (2026-09-26), por decisão de João, e trocado
  por `unavailableContactIntake` (`src/integrations/contact/intake.ts`) — mesmo papel, nome novo
  porque a peça passou a viver do lado do intake, não de um adapter (`ContactSender`). Não deve ser
  restaurado sob o nome antigo.
- **D2 — a região do SES fecha em `sa-east-1`, revogando "Região a confirmar" (≈ linha 90).**
  `aws sesv2 get-account --region sa-east-1` respondeu `SendingEnabled: true` em 2026-09-26 (spec
  D2): função, identidade SES, bucket e distribuição ficam todos na mesma região, e o MX do MAIL
  FROM é o de lá.
- **D3 — production access do SES não é necessário.** Sandbox só restringe destinatário a
  identidade verificada, e o destinatário é do domínio verificado. A PENDÊNCIA 3 sai.
- **D5 — sem WAF; sem rate limit dedicado.** A opção "CloudFront Function contando por IP"
  desta ADR **não existe**: CloudFront Function não guarda estado entre requisições. Sobra o WAF,
  a ~US$ 6/mês; João decidiu não criar agora. Defesa: honeypot, Turnstile, schema na função, teto
  do sandbox (200/dia, 1/s), teto de concorrência da conta (10). Débito `D-54`.
- **D6 — Turnstile como captcha.** Não previsto aqui. Cloudflare Turnstile em modo
  `interaction-only`, carregado só quando `#Contacto` se aproxima; site key pública no bundle,
  secret key no SSM (`/lotus-site/contato/turnstile-secret`), verificação na função antes de
  qualquer envio. Divergência intencional em relação ao WordPress, na matriz de paridade.
- **D7 — existe um segredo, revogando "`7.1.3` fecha por construção… Não sobra segredo nenhum" (≈
  127-131).** A secret key do Turnstile mora no SSM Parameter Store, `SecureString`
  `/lotus-site/contato/turnstile-secret`, chave gerenciada `alias/aws/ssm`. A função lê o valor uma
  vez por cold start e o guarda em memória; ele nunca passa pelo repositório, pelo template, pelo
  bundle nem pelo log.
- **Escopo real da role, revogando "A role da função pode `ses:SendEmail` e nada mais" (≈ linha
  72).** `infra/lotus-contato.yaml` dá à `PapelDaFuncao` três permissões, não uma: `ses:SendEmail`
  no ARN da identidade `lotusotec.cl`, com `Condition.StringEquals` em `ses:FromAddress`;
  `ssm:GetParameter` no ARN do parâmetro `/lotus-site/contato/turnstile-secret`; e
  `logs:CreateLogStream`/`logs:PutLogEvents` no ARN explícito do log group `Registros`, sem
  curinga.
