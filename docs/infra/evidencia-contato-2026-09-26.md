# Evidência — contato por SES + Lambda + Turnstile (bloco `B2`)

Data: 2026-09-26. Branch `feat/4-1-7-7-1-3-7-1-4-contato-ses-lambda`, HEAD
`d5260cbebbdccf0c5ddc001079ff1d7ea0f0e0da` (`d5260cb`). Função publicada com `CodeSha256`
`AFRNNKeV4zFpTl9RIhBhZOy/s8QTZq4RVC0dv221Z68=` (`CodeSize` 27502). Site publicado à mão espelhando
o job `deploy`, com a site key real do widget (`VITE_TURNSTILE_SITE_KEY=0x4AAAAAAFErz6_Md-YOkwY-`);
invalidação `ICZVCCLU10TQP9VACDXCHQX803`; bundle `assets/index-CHS0BG7Q.js`. `curl -I
https://dhpoztt69jydz.cloudfront.net/` devolveu `x-robots-tag: noindex, nofollow` e a home em
`200` — é homologação, não produção pública (`B5` não aconteceu).

Cada escrita na conta foi autorizada por João naquele passo, em 2026-09-26 (spec §5):
`execute-change-set` de `lotus-contato`; `execute-change-set` de `lotus-site`;
`update-function-code` (publicação); `s3 sync` + `create-invalidation` (site); um segundo
`update-function-code` com o mesmo zip, para forçar o cold start (ver "Desvios do plano").

SES segue em sandbox: `get-account` devolveu `{"Envios24h": 1.0, "Max24h": 200.0, "Producao":
false}`, medido depois da mensagem real — suficiente porque o destinatário é do domínio verificado
(`D3` da spec).

## G5 pendente com João

As variáveis de repositório `AWS_CONTACT_FUNCTION` e `VITE_TURNSTILE_SITE_KEY`, em
`Gatika-CL/lotus-site`, **não foram criadas**. Runbook §8.4. São obrigatórias antes do merge: sem
`VITE_TURNSTILE_SITE_KEY` o `deploy` recusa o build (commit `fix(7.1.3)` do bloco de correções da
review); sem `AWS_CONTACT_FUNCTION` o `deploy` publica o site e pula a função, com aviso, e o
placeholder `503` fica no ar. A saída de `gh variable list --repo Gatika-CL/lotus-site`, só com os
nomes das variáveis (nunca o valor da site key), entra nesta evidência, em commit próprio, antes de
`/fechar-site`.

## Task 10 — segunda volta

Sem commit próprio — fica registrado aqui porque é o único rastro desta segunda volta pela infra,
feita em 2026-09-26 antes das provas da Task 11.

Parâmetro SSM (`describe-parameters`, nunca o valor):

```text
|  Chave |  alias/aws/ssm                          |
|  Nome  |  /lotus-site/contato/turnstile-secret   |
|  Tipo  |  SecureString                           |
|  Versao|  1                                      |
```

Change set `lotus-contato` (executado; `UPDATE_COMPLETE`):

```text
|  Add |  Funcao         |  None      |  AWS::Lambda::Function  |
|  Add |  PapelDaFuncao  |  None      |  AWS::IAM::Role         |
|  Add |  Registros      |  None      |  AWS::Logs::LogGroup    |
|  Add |  UrlDaFuncao    |  None      |  AWS::Lambda::Url       |
```

Nenhuma linha para `IdentidadeDeEnvio` — a identidade já existia. Função publicada: `nodejs24.x`,
`arm64`, `Active`, 128 MB, timeout 10 segundos; o risco de runtime da spec §11 não se materializou.

Outputs: `DominioDaUrlDaFuncao` `4rienpro3je6s7r4wbonx7qdky0izeoz.lambda-url.sa-east-1.on.aws`;
`ArnDaFuncao` `arn:aws:lambda:sa-east-1:760144413534:function:lotus-site-contato`; `NomeDaFuncao`
`lotus-site-contato`. Prova mínima logo depois: `url direta: 403`.

Change set `lotus-site` (executado sem `--tags`; `UPDATE_COMPLETE`; `distribution-deployed` ok —
ver "Desvios do plano" para o porquê de não levar `--tags`):

```text
|  Add   |  ControleDeAcessoDaFuncao |  None         |
|  Modify|  Distribuicao             |  False        |
|  Modify|  PapelDeDeploy            |  False        |
|  Add   |  PermissaoDeInvocacao     |  None         |
|  Add   |  PermissaoDeUrl           |  None         |
|  Modify|  Teto                     |  Conditional  |
```

Parâmetros do change set: `EmailDeAlerta` igual ao já configurado no stack; `DominioDaFuncaoDeContato`
e `ArnDaFuncaoDeContato` com os outputs acima. `Teto` ficou `Conditional` porque `CostFilters`
mudou; o evento do stack mostrou `UPDATE_COMPLETE` com o mesmo `PhysicalId` `lotus-site-teto` —
atualizado no lugar, não recriado.

Placeholder testado pela distribuição, antes da publicação da mensagem real: `POST /api/contacto`
com o hash `x-amz-content-sha256` devolveu `{"ok":false}` `503`.

## `7.1.4` — domínio autenticado

Status da identidade em `lotusotec.cl`, medido em 2026-09-26:

```text
aws sesv2 get-email-identity --region sa-east-1 --email-identity lotusotec.cl \
  --query '{Verificada:VerifiedForSendingStatus,Dkim:DkimAttributes.Status,MailFrom:MailFromAttributes.MailFromDomainStatus}' --output table
---------------------------------------
|          GetEmailIdentity           |
+---------+------------+--------------+
|  Dkim   | MailFrom   | Verificada   |
+---------+------------+--------------+
|  SUCCESS|  SUCCESS   |  True        |
+---------+------------+--------------+
```

Registros na zona conferidos em `docs/infra/conferencia-zona-2026-09-26-pos-ses.md` (commit
`7177f4f`).

Notificações AWS Health recebidas em `contacto@gatika.cl` (contato da conta), 2026-09-26, confirmam
a mesma conclusão pelo lado da AWS:

- `AWS_SES_CMF_PENDING_TO_SUCCESS` — "Amazon SES has successfully detected the MX record required
  to use ses.lotusotec.cl as a custom MAIL FROM domain for verified identity lotusotec.cl" — Start
  time Sat, 26 Sep 2026 18:35:41 GMT.
- `AWS_SES_DKIM_PENDING_TO_VERIFIED` — "Your DKIM setup for the domain lotusotec.cl is complete" —
  Start time Sat, 26 Sep 2026 18:39:37 GMT.

`Authentication-Results` da mensagem real: **não coletado.** No momento em que a mensagem real
chegou, o destinatário só tinha acesso ao app de e-mail do celular, sem a opção "Mostrar original";
João aceitou a prova parcial como exceção declarada em 2026-09-27 (ver "Desvios do plano"). Vira
débito `D-56`, registrado na Task 12. O que fica provado por este bloco para a `7.1.4` é o status
da identidade acima e as duas notificações do AWS Health; `dkim=pass` e `spf=pass` na mensagem real
não foram observados e não são afirmados aqui.

## `4.1.7` — mensagem real

- Enviada em 2026-09-26, às 18:39 hora do Chile (21:39 UTC), por João, pelo formulário em
  `https://dhpoztt69jydz.cloudfront.net/#Contacto`; a tela mostrou a mensagem de sucesso ("Gracias.
  Recibimos su mensaje…").
- Log da função: `2026-09-26T21:39:42.119Z {"requestId":"bfaa3d83-0bf6-4b13-b806-adc938a254b5","desfecho":"enviado"}`.
- Chegou em `contacto@lotusotec.cl`, na pasta Recibidos (não caiu em spam); confirmado pelo
  destinatário da caixa, com captura de tela mostrada a João. Assunto exibido: "Nuevo mensaje desde
  el sitio de Lotus OTEC"; remetente exibido: "Sitio Lotus OTEC". O corpo lista Nombre, Correo,
  Empresa, Mensaje e a linha "Enviado desde el formulario de contacto de lotusotec.cl".
- `Reply-To` funcionando na prática: o destinatário respondeu ("Llego!") e a resposta chegou no
  endereço digitado no formulário — não reproduzido aqui por ser um dado pessoal.
- `Message-ID`, `Date`, `From`, `Reply-To` e a linha `Authentication-Results` da mensagem real:
  **não coletados.** O destinatário só tinha o app de e-mail do celular no momento, sem a opção
  "Mostrar original". João aceitou a prova parcial como exceção declarada em 2026-09-27; vira
  débito `D-56` (registrado na Task 12).

Provas negativas (2026-09-26, ~21:53 UTC):

```text
url direta: 403
sem hash: 403
{"ok":false}
token invalido: 403
SentLast24Hours antes=1.0 depois=1.0
{"ok":false}
GET: 405
```

Log da função na janela das provas negativas (últimas 3h, sem linhas `START`/`END`/`REPORT`):

```text
2026-09-26T21:31:51.147Z {"requestId":"0ea54acc-483b-486e-8821-6243ea7db560","desfecho":"captcha-indisponivel"}
2026-09-26T21:35:25.300Z {"requestId":"e6a6d9ad-5548-411f-b8a5-9380da3c8f00","desfecho":"captcha-indisponivel"}
2026-09-26T21:36:45.502Z {"requestId":"c42d0dc9-1bc7-4adb-b222-4849f440fce2","desfecho":"captcha-recusado"}
2026-09-26T21:39:42.119Z {"requestId":"bfaa3d83-0bf6-4b13-b806-adc938a254b5","desfecho":"enviado"}
2026-09-26T21:53:25.332Z {"requestId":"781fdd81-e9ce-4663-af92-a2fa059526e5","desfecho":"captcha-recusado"}
2026-09-26T21:53:26.889Z {"requestId":"299287e9-bc26-45e7-85a5-69fbfb47e206","desfecho":"metodo"}
```

As duas linhas `captcha-indisponivel` vêm do segredo inválido gravado na primeira volta da Task 10
(ver "Desvios do plano"), antes da correção — não da mensagem real. `grep -ci
'prueba|<nome>|gmail|ssssss'` no log devolveu `0`: nenhum dado de formulário logado.

## `7.1.3` — nenhum segredo fora do lugar

```text
--- 1  grep -rEn 'AKIA[0-9A-Z]{16}|aws_secret|turnstile-secret' dist/ dist-lambda/ || echo 'nada'
nada
--- 2  grep -rEo '0x4AAAA[A-Za-z0-9_-]*' dist/ | sort -u
dist/assets/index-CHS0BG7Q.js:0x4AAAAAAFErz6_Md-YOkwY-
--- 3  grep -rEo '0x4AAAA[A-Za-z0-9_-]*' dist-lambda/ || echo 'nada em dist-lambda'
nada em dist-lambda
--- 4  grep -rIl -i web3forms . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.superpowers
CONTEXT.md  (corrigido na Task 12 por decisão de João de 2026-09-27)
```

O restante do resultado do item 4 só devolveu arquivos de `docs/` — ADR-SITE-002, ADR-SITE-003, ADR-SITE-004 e ADR-SITE-005, o histórico (`docs/superpowers/historico/progress.md`), specs, planos, context packets, bounded design, backlog e o relatório de homologação (`docs/qa/homologacao-2026-08-29.md`).

João, no terminal dele, com a secret key **inteira** digitada num `read -s` (não os oito primeiros
caracteres do plano):

```text
grep -rlF "$P" dist/ dist-lambda/ || echo vazio
vazio
```

Por que a chave inteira, e não oito caracteres: a site key e a secret key do Turnstile começam
ambas com `0x4AAAAA`; o grep com oito caracteres casou com a site key pública — falso positivo,
conferido e descartado.

O template `infra/lotus-contato.yaml` carrega `/lotus-site/contato/turnstile-secret` como nome do
parâmetro e nenhum valor. A função envia com a role
`arn:aws:iam::760144413534:role/lotus-contato-PapelDaFuncao-i32n9puceUwx` e nenhuma outra
credencial.

## Budget

```text
aws ce get-dimension-values --dimension SERVICE ... | grep -Ei 'email|lambda|cloudwatch'
AWS Lambda
Amazon Simple Email Service
AmazonCloudWatch
```

Os três nomes batem exatamente com o `CostFilters` do `Teto`; nenhuma correção de filtro foi
necessária.

## Desvios do plano

1. **`--tags` no change set do `lotus-site`.** O comando do plano (Task 10 Step 5) leva
   `--tags Projeto=lotus-site`; o stack `lotus-site` não tinha tag de stack (`[]`), e a tag de
   stack propaga — o change set com `--tags` trouxe `Modify` (escopo `Tags`) em `Balde`,
   `PoliticaDoBalde`, `ControleDeAcesso` e `PoliticaDeCabecalhos`, mais `PoliticaDoBalde` com
   `PolicyDocument` (`ResourceAttribute`) — uma linha de pare. Esse change set foi apagado sem
   executar; o refeito sem `--tags`, igual ao runbook 8.3, foi o executado (tabela em "Task 10 —
   segunda volta").
2. **`zip` ausente no host.** O zip da função foi montado com `python3`/`zipfile` (só
   `index.mjs`, igual ao runbook 8.5) em vez do utilitário `zip`. O runner do CI tem `zip`
   disponível; a publicação futura pelo pipeline não repete este desvio.
3. **Segredo inválido na primeira gravação.** A versão 1 do parâmetro SSM não era a secret key do
   widget: o `siteverify` da Turnstile devolvia HTTP 400 `invalid-input-secret`, que a função trata
   como indisponível → `502` (as duas linhas `captcha-indisponivel` no log de provas negativas). O
   CloudTrail mostrou `GetParameter`/`Decrypt` da role sem erro — IAM e KMS corretos, o problema
   era só o valor gravado. João regravou o parâmetro (versão 2) e conferiu no terminal dele:
   `invalid-input-response` (segredo aceito pelo endpoint da Turnstile; o token de teste enviado
   foi rejeitado, como esperado). A instância quente da função ainda guardava o valor antigo em
   cache (cache por cold start, spec D7): um segundo `update-function-code` com o mesmo zip (mesmo
   `CodeSha256`), autorizado por João, forçou a releitura; depois disso, token inválido passou a
   devolver `403`.
4. **Grep do segredo com a chave inteira, em vez de oito caracteres.** Ver "`7.1.3` — nenhum
   segredo fora do lugar": o grep com os oito primeiros caracteres do plano casaria com a site key
   pública, que começa com o mesmo prefixo.
5. **Headers da mensagem real não coletados.** `Message-ID`, `Date`, `From`, `Reply-To` e a linha
   `Authentication-Results` da mensagem real não foram coletados — exceção declarada por João em
   2026-09-27 (ver "`7.1.4`" e "`4.1.7`"). Vira débito `D-56`, registrado na Task 12.
