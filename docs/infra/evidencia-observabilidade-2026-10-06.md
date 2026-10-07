# Evidência — observabilidade mínima (`7.2.6`, bloco `B6`)

Spec: `docs/superpowers/specs/2026-10-05-7.2.6-observabilidade-minima-design.md`. Plano:
`docs/superpowers/plans/2026-10-06-7.2.6-observabilidade-minima.md`. O destinatário aparece como
`jv***@gmail.com`: o endereço completo não entra no repositório (spec D2). Horários em UTC; tabelas
coladas da saída da AWS CLI.

## 1. O stack `lotus-observabilidade` (spec §5, passo 3)

### 1.1 Antes do change set

Lido em 2026-10-06, antes de criar o change set (plano, Task 3, Step 1): o stack não existia
(`Stack with id lotus-observabilidade does not exist`); em `us-east-1`, zero delivery sources, zero
resource policies de CloudWatch Logs no escopo da conta e no do log group `lotus-site-acessos`, zero
log groups com esse prefixo, zero tópicos `lotus-site-alertas`; zero health checks de `lotusotec.cl`;
a role `lotus-site-alerta` não existia (`NoSuchEntity`). `https://lotusotec.cl/` respondeu `200` e
`https://lotusotec.cl/prova-b6-inexistente`, `404`.

### 1.2 Change set da criação

- Data: 2026-10-06.
- Executou: Claude, com autorização explícita de João dada neste passo ("Autorizo executar o change
  set do stack de observabilidade", pelo Remote Control, em resposta ao portão do Step 3).
- Change set: `arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791288770/f4994f08-b9c3-407e-92cf-695630d53269`
  (stack `lotus-observabilidade`, `us-east-1`), com `--capabilities CAPABILITY_NAMED_IAM` e
  `--tags Projeto=lotus-site`; destinatário `jv***@gmail.com`, lido do parâmetro `EmailDeAlerta` do
  `lotus-site`. `validate-template`: `CAPABILITY_NAMED_IAM`.

```text
|  Acao  |      Recurso       |              Tipo                |
|  Add   |  Acessos           |  AWS::Logs::LogGroup             |
|  Add   |  Alarme5xx         |  AWS::CloudWatch::Alarm          |
|  Add   |  AlarmeDeSaude     |  AWS::CloudWatch::Alarm          |
|  Add   |  Assinatura        |  AWS::SNS::Subscription          |
|  Add   |  Consulta5xx       |  AWS::Logs::QueryDefinition      |
|  Add   |  ConsultaCache     |  AWS::Logs::QueryDefinition      |
|  Add   |  ConsultaLatencia  |  AWS::Logs::QueryDefinition      |
|  Add   |  ConsultaReleases  |  AWS::Logs::QueryDefinition      |
|  Add   |  DestinoDoLog      |  AWS::Logs::DeliveryDestination  |
|  Add   |  EntregaDoLog      |  AWS::Logs::Delivery             |
|  Add   |  OrigemDoLog       |  AWS::Logs::DeliverySource       |
|  Add   |  PapelDeAlerta     |  AWS::IAM::Role                  |
|  Add   |  SaudeDoSite       |  AWS::Route53::HealthCheck       |
|  Add   |  Topico            |  AWS::SNS::Topic                 |
```

Catorze linhas, todas `Add`. Na criação não há diff por propriedade: tudo é novo.

- `execute-change-set`: 2026-10-06T12:51:55Z.
- `CREATE_COMPLETE` da stack (evento): 2026-10-06T12:52:18.578Z. Nenhum evento `*_FAILED`.

### 1.3 O que o stack criou

Outputs:

```text
|  ArnDoTopico        |  arn:aws:sns:us-east-1:760144413534:lotus-site-alertas  |
|  NomeDoLogDeAcesso  |  lotus-site-acessos                                     |
|  IdDoHealthCheck    |  28047618-872b-4a39-90d9-3e1ff6d1ed53                   |
|  ArnDoPapelDeAlerta |  arn:aws:iam::760144413534:role/lotus-site-alerta       |
```

Origem e entrega do access log:

```text
|  Nome   |  lotus-site-acessos-origem                                      |
|  Recurso|  arn:aws:cloudfront::760144413534:distribution/E1R7SPH4OLUIEQ   |
|  Tipo   |  ACCESS_LOGS                                                    |

|  Campos |  12                                                                                    |
|  Destino|  arn:aws:logs:us-east-1:760144413534:delivery-destination:lotus-site-acessos-destino   |
|  Origem |  lotus-site-acessos-origem                                                             |
```

A resource policy que a entrega criou, no escopo do log group, já existia depois do
`CREATE_COMPLETE`. No escopo `RESOURCE` ela não tem nome: a API a identifica pelo escopo, pelo ARN
do log group e pela revisão — `policyScope` `RESOURCE`, `resourceArn`
`arn:aws:logs:us-east-1:760144413534:log-group:lotus-site-acessos`, `revisionId` `1`,
`lastUpdatedTime` 2026-10-06T12:52:10Z. O `Sid` é `AWSLogDeliveryWrite1` (o plano previa
`AWSLogDeliveryWrite20150319`); o resto é o esperado:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AWSLogDeliveryWrite1",
      "Effect": "Allow",
      "Principal": { "Service": "delivery.logs.amazonaws.com" },
      "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:us-east-1:760144413534:log-group:lotus-site-acessos:log-stream:*",
      "Condition": {
        "StringEquals": { "aws:SourceAccount": "760144413534" },
        "ArnLike": {
          "aws:SourceArn": "arn:aws:logs:us-east-1:760144413534:delivery-source:lotus-site-acessos-origem"
        }
      }
    }
  ]
}
```

No escopo da conta, nenhuma (`0`). A policy não é recurso do stack: o desmonte a apaga à parte
(runbook, §7).

Consultas salvas — o prefixo `lotus-site/` que o plano usava é recusado pela API
(`QueryNamePrefix parameter can not starts or ends with '/'`); a leitura usou `lotus-site` e filtrou
os nomes que começam por `lotus-site/`:

```text
|  lotus-site-acessos |  lotus-site/latencia-por-borda  |
|  lotus-site-acessos |  lotus-site/cache-do-index      |
|  lotus-site-acessos |  lotus-site/acessos-a-releases  |
|  lotus-site-acessos |  lotus-site/5xx-por-caminho     |
```

### 1.4 Alarmes e checadores depois da criação

Às 12:53:13Z, os dois alarmes ainda em `INSUFFICIENT_DATA`, desde a criação (12:52:01Z). Os seis
checadores, dois por região:

```text
|  us-east-1|  Success: HTTP Status Code 200, OK. Resolved IP: 3.167.112.62    |
|  us-west-2|  Success: HTTP Status Code 200, OK. Resolved IP: 3.163.24.3      |
|  sa-east-1|  Success: HTTP Status Code 200, OK. Resolved IP: 13.227.110.69   |
|  us-west-2|  Success: HTTP Status Code 200, OK. Resolved IP: 3.163.24.104    |
|  us-east-1|  Success: HTTP Status Code 200, OK. Resolved IP: 3.167.112.55    |
|  sa-east-1|  Success: HTTP Status Code 200, OK. Resolved IP: 13.227.110.41   |
```

Histórico (`StateUpdate` e `Action`):

```text
== lotus-site-indisponivel StateUpdate
2026-10-06T12:53:16.205000+00:00  Alarm updated from INSUFFICIENT_DATA to OK  Threshold Crossed: 1 out of the last 1 datapoints [1.0 (06/10/26 12:52:00)] was not less than the threshold (1.0) (minimum 1 datapoint for ALARM -> OK transition).
== lotus-site-indisponivel Action
2026-10-06T12:53:16.248000+00:00  Successfully executed action arn:aws:sns:us-east-1:760144413534:lotus-site-alertas
== lotus-site-5xx StateUpdate
2026-10-06T12:53:21.956000+00:00  Alarm updated from INSUFFICIENT_DATA to OK  Threshold Crossed: no datapoints were received for 1 period and 1 missing datapoint was treated as [NonBreaching].
== lotus-site-5xx Action
2026-10-06T12:53:21.991000+00:00  Successfully executed action arn:aws:sns:us-east-1:760144413534:lotus-site-alertas
```

O `lotus-site-indisponivel` saiu de `INSUFFICIENT_DATA` direto para `OK`, com ponto real, sem o
`ALARM` transitório que o plano admitia. As duas publicações no tópico aconteceram com a assinatura
ainda pendente: nenhum e-mail.

O `lotus-site-5xx` foi a `OK` por falta de ponto. Uma leitura a mais, fora do plano, feita às
12:55Z sobre as `Metrics` do alarme implantado (as mesmas do Step 15), nos 20 minutos anteriores:

```json
{
  "Estado": "Complete",
  "Instantes": [
    "2026-10-06T12:35:00+00:00",
    "2026-10-06T12:49:00+00:00",
    "2026-10-06T12:50:00+00:00",
    "2026-10-06T12:51:00+00:00",
    "2026-10-06T12:52:00+00:00",
    "2026-10-06T12:53:00+00:00",
    "2026-10-06T12:54:00+00:00"
  ],
  "Valores": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
}
```

O alarme lê dado: os pontos de 12:49 a 12:52 existem, mas ainda não tinham sido publicados quando
ele avaliou às 12:53:21, o que é compatível com atraso de publicação da métrica. A razão citando
ponto real fica para depois da prova do 5xx (Task 3, Step 14).

## 2. Destinatário confirmado (spec §7, item 1)

O e-mail de confirmação do SNS ("AWS Notification - Subscription Confirmation", de
`no-reply@sns.amazonaws.com`) chegou a `jv***@gmail.com` às 12:52Z, na caixa de entrada. Às 12:56:46Z
a assinatura ainda estava `PendingConfirmation`, e o fluxo parou no portão da confirmação.

João confirmou pelo link do e-mail, do celular, e mandou o print da página "Assinatura confirmada!",
com o ID `arn:aws:sns:us-east-1:760144413534:lotus-site-alertas:5a5f8b09-9b6e-4a17-bf3c-7f11285e48f4`.
Confirmação entre 12:57Z e 13:01:34Z de 2026-10-06, declarada por João. Lido às 13:01:34Z:

```text
|  Assinatura|  arn:aws:sns:us-east-1:760144413534:lotus-site-alertas:5a5f8b09-9b6e-4a17-bf3c-7f11285e48f4   |
|  Protocolo |  email                                                                                        |
```

Uma assinatura `email`, com ARN: não está mais `PendingConfirmation`. Os dois alarmes seguiam em
`OK`.

## 3. Indisponibilidade detectada sozinha (spec §7, item 2)

### 3.1 Change set da prova: `CaminhoDaSonda=/prova-b6-inexistente`

- Data: 2026-10-06.
- Change set: `arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791291722/0b10cf7e-85ae-456d-93aa-69331cc777f0`
  (stack `lotus-observabilidade`, `us-east-1`), só com o override
  `CaminhoDaSonda=/prova-b6-inexistente`; o template não muda (spec §6).

A tabela do plano (`describe-change-set` sem `--include-property-values`) veio com duas linhas, e o
plano esperava uma, `Modify SaudeDoSite False`:

```text
|  Acao  |     Recurso     | Substituicao   |
|  Modify|  AlarmeDeSaude  |  False         |
|  Modify|  SaudeDoSite    |  Conditional   |
```

O diff por propriedade, lido com `--include-property-values`, tem exatamente a linha esperada:

```text
SaudeDoSite /Properties/HealthCheckConfig/ResourcePath: "/" -> "/prova-b6-inexistente"
```

As duas leituras do mesmo change set divergem na granularidade. Sem os valores, a CloudFormation
avalia a propriedade `HealthCheckConfig` inteira — `RequiresRecreation: Conditionally`, origem
`ParameterReference` (`CaminhoDaSonda`) —, e o `AlarmeDeSaude` entra só como consequência dinâmica
do `!Ref SaudeDoSite` (`Dimensions`, `Evaluation: Dynamic`, `ChangeSource: ResourceReference`). Com
os valores, ela avalia o subcampo `/Properties/HealthCheckConfig/ResourcePath` —
`RequiresRecreation: Never` —, e a mudança é uma só, `SaudeDoSite` com `Replacement: False`, sem o
alarme. O schema do recurso (`describe-type AWS::Route53::HealthCheck`) dá como create-only só
`HealthCheckConfig/Type`, `MeasureLatency` e `RequestInterval`; o `update` usa
`route53:UpdateHealthCheck`. Pela regra do plano — recurso fora do esperado para o fluxo —, a
decisão de executar foi de João, no portão.

### 3.2 A prova executada e o `ALARM`

- Executado por Claude, com a autorização de João dada neste passo: "Autorizo executar o change set
  da prova do health check."
- O change set ainda `AVAILABLE` às 13:30:47Z. `execute` às 13:30:48Z; `UPDATE_COMPLETE` às
  13:30:55.100Z.

Os eventos da atualização, sem `ResourceProperties`:

```text
2026-10-06T13:30:48.233000+00:00  lotus-observabilidade  AWS::CloudFormation::Stack  UPDATE_IN_PROGRESS
2026-10-06T13:30:51.066000+00:00  SaudeDoSite  AWS::Route53::HealthCheck  UPDATE_IN_PROGRESS  28047618-872b-4a39-90d9-3e1ff6d1ed53
2026-10-06T13:30:52.728000+00:00  SaudeDoSite  AWS::Route53::HealthCheck  UPDATE_COMPLETE  28047618-872b-4a39-90d9-3e1ff6d1ed53
2026-10-06T13:30:54.383000+00:00  lotus-observabilidade  AWS::CloudFormation::Stack  UPDATE_COMPLETE_CLEANUP_IN_PROGRESS
2026-10-06T13:30:55.100000+00:00  lotus-observabilidade  AWS::CloudFormation::Stack  UPDATE_COMPLETE
```

Só o `SaudeDoSite` mudou, e no lugar: o `IdDoHealthCheck` continua
`28047618-872b-4a39-90d9-3e1ff6d1ed53`, agora na versão 2, com `ResourcePath`
`/prova-b6-inexistente` e o resto igual (HTTPS, `lotusotec.cl`, intervalo 30, limite 3, SNI). Nenhum
evento do `AlarmeDeSaude`: a leitura fina do change set (§3.1) estava certa, e a tabela de duas
linhas era a visão da propriedade inteira.

Uma leitura a mais, fora do plano, com `curl` no site público: `/prova-b6-inexistente` responde
`404` (311 bytes); `/`, `200`. O visitante não é afetado.

O `wait` do `ALARM` voltou na primeira tentativa (13:34:14Z, relógio local). Os checadores, lidos
logo depois:

```text
|  us-east-1|  Failure: HTTP Status Code 404, Not Found. Resolved IP: 3.167.112.73    |
|  us-west-2|  Failure: HTTP Status Code 404, Not Found. Resolved IP: 3.163.24.104    |
|  sa-east-1|  Failure: HTTP Status Code 404, Not Found. Resolved IP: 13.227.110.41   |
|  us-west-2|  Failure: HTTP Status Code 404, Not Found. Resolved IP: 3.163.24.3      |
|  us-east-1|  Failure: HTTP Status Code 404, Not Found. Resolved IP: 3.167.112.62    |
|  sa-east-1|  Failure: HTTP Status Code 404, Not Found. Resolved IP: 13.227.110.33   |
```

Histórico do `lotus-site-indisponivel` desde a criação:

```text
== StateUpdate
2026-10-06T13:34:16.205000+00:00  Alarm updated from OK to ALARM  Threshold Crossed: 1 out of the last 1 datapoints [0.0 (06/10/26 13:33:00)] was less than the threshold (1.0) (minimum 1 datapoint for OK -> ALARM transition).
2026-10-06T12:53:16.205000+00:00  Alarm updated from INSUFFICIENT_DATA to OK  Threshold Crossed: 1 out of the last 1 datapoints [1.0 (06/10/26 12:52:00)] was not less than the threshold (1.0) (minimum 1 datapoint for ALARM -> OK transition).
== Action
2026-10-06T13:34:16.262000+00:00  Successfully executed action arn:aws:sns:us-east-1:760144413534:lotus-site-alertas
2026-10-06T12:53:16.248000+00:00  Successfully executed action arn:aws:sns:us-east-1:760144413534:lotus-site-alertas
```

Do `UPDATE_COMPLETE` ao `ALARM`, 3 min 21 s, compatível com as três falhas seguidas, a cada 30 s, e
a avaliação por minuto. A razão cita ponto real (`0.0` às 13:33). A publicação das 13:34:16 é a
primeira no tópico com a assinatura confirmada.

O e-mail `ALARM: "lotus-site-indisponivel" in US East (N. Virginia)` chegou a `jv***@gmail.com`, na
caixa de entrada, às 10:34 no relógio de João (13:34Z), declarado por João com o print da mensagem:
remetente `lotus-site`, `Timestamp` 13:34:16 UTC, `State Change: OK -> ALARM`, a mesma razão do
histórico e a `Description` do alarme, que aponta o que fazer (`docs/infra/runbook-aws.md`, secção
11).

### 3.3 Change set da volta: `CaminhoDaSonda=/`

- Data: 2026-10-06.
- Change set: `arn:aws:cloudformation:us-east-1:760144413534:changeSet/awscli-cloudformation-package-deploy-1791293693/d7f446b4-b9fb-4bcf-934c-ed1ec6d8fff6`
  (stack `lotus-observabilidade`, `us-east-1`), com o override explícito `CaminhoDaSonda=/`: sem ele,
  o `deploy` reusaria o caminho da prova.

A mesma tabela de duas linhas da prova, pela mesma razão (§3.1):

```text
|  Acao  |     Recurso     | Substituicao   |
|  Modify|  AlarmeDeSaude  |  False         |
|  Modify|  SaudeDoSite    |  Conditional   |
```

O diff por propriedade, a linha esperada:

```text
SaudeDoSite /Properties/HealthCheckConfig/ResourcePath: "/prova-b6-inexistente" -> "/"
```

Com `--include-property-values`: uma mudança, `SaudeDoSite` `Modify`, `Replacement: False`;
`ResourcePath` com `RequiresRecreation: Never`, origens `ParameterReference` e `DirectModification`.

### 3.4 A volta executada e o `OK`

- Executado por Claude, com a autorização de João dada neste passo: "Autorizo executar o change set
  da volta do health check."
- O change set ainda `AVAILABLE` às 13:54:59Z. `execute` às 13:55:00Z; `UPDATE_COMPLETE` às
  13:55:06.607Z.

Os eventos da atualização, sem `ResourceProperties`:

```text
2026-10-06T13:55:00.302000+00:00  lotus-observabilidade  AWS::CloudFormation::Stack  UPDATE_IN_PROGRESS
2026-10-06T13:55:02.829000+00:00  SaudeDoSite  AWS::Route53::HealthCheck  UPDATE_IN_PROGRESS  28047618-872b-4a39-90d9-3e1ff6d1ed53
2026-10-06T13:55:04.273000+00:00  SaudeDoSite  AWS::Route53::HealthCheck  UPDATE_COMPLETE  28047618-872b-4a39-90d9-3e1ff6d1ed53
2026-10-06T13:55:05.867000+00:00  lotus-observabilidade  AWS::CloudFormation::Stack  UPDATE_COMPLETE_CLEANUP_IN_PROGRESS
2026-10-06T13:55:06.607000+00:00  lotus-observabilidade  AWS::CloudFormation::Stack  UPDATE_COMPLETE
```

De novo só o `SaudeDoSite`, no lugar: mesmo `IdDoHealthCheck`, agora na versão 3. O parâmetro
`CaminhoDaSonda` e o `ResourcePath` do health check voltaram a `/`.

O `wait` do `OK` voltou na primeira tentativa (13:59:19Z, relógio local). Os checadores, lidos logo
depois:

```text
|  us-east-1|  Success: HTTP Status Code 200, OK. Resolved IP: 3.167.112.56    |
|  us-west-2|  Success: HTTP Status Code 200, OK. Resolved IP: 3.163.24.31     |
|  sa-east-1|  Success: HTTP Status Code 200, OK. Resolved IP: 13.227.110.69   |
|  us-west-2|  Success: HTTP Status Code 200, OK. Resolved IP: 3.163.24.3      |
|  us-east-1|  Success: HTTP Status Code 200, OK. Resolved IP: 3.167.112.73    |
|  sa-east-1|  Success: HTTP Status Code 200, OK. Resolved IP: 13.227.110.69   |
```

Histórico do `lotus-site-indisponivel`, a prova inteira:

```text
== StateUpdate
2026-10-06T13:59:16.206000+00:00  Alarm updated from ALARM to OK  Threshold Crossed: 1 out of the last 1 datapoints [1.0 (06/10/26 13:58:00)] was not less than the threshold (1.0) (minimum 1 datapoint for ALARM -> OK transition).
2026-10-06T13:34:16.205000+00:00  Alarm updated from OK to ALARM  Threshold Crossed: 1 out of the last 1 datapoints [0.0 (06/10/26 13:33:00)] was less than the threshold (1.0) (minimum 1 datapoint for OK -> ALARM transition).
2026-10-06T12:53:16.205000+00:00  Alarm updated from INSUFFICIENT_DATA to OK  Threshold Crossed: 1 out of the last 1 datapoints [1.0 (06/10/26 12:52:00)] was not less than the threshold (1.0) (minimum 1 datapoint for ALARM -> OK transition).
== Action
2026-10-06T13:59:16.252000+00:00  Successfully executed action arn:aws:sns:us-east-1:760144413534:lotus-site-alertas
2026-10-06T13:34:16.262000+00:00  Successfully executed action arn:aws:sns:us-east-1:760144413534:lotus-site-alertas
2026-10-06T12:53:16.248000+00:00  Successfully executed action arn:aws:sns:us-east-1:760144413534:lotus-site-alertas
```

Uma ação no tópico por transição. Do `UPDATE_COMPLETE` ao `OK`, 4 min 10 s. Razão do estado no
`describe-alarms`: `Threshold Crossed: 1 out of the last 1 datapoints [1.0 (06/10/26 13:58:00)] was
not less than the threshold (1.0)`, com ponto real. O alarme ficou em `ALARM` de 13:34:16Z a
13:59:16Z: nesses 25 minutos, uma queda real não mandaria e-mail novo.

O e-mail `OK: "lotus-site-indisponivel" in US East (N. Virginia)` chegou a `jv***@gmail.com`, na
caixa de entrada (aba Principal), declarado por João com o print da lista de mensagens: remetente
`lotus-site`, acima do `OK: "lotus-site-5xx"` das 10:57. O horário não aparece no print (a linha
estava sob o cursor) e João não o declarou depois: fica sem horário declarado. A publicação no tópico
foi às 13:59:16Z (10:59 no relógio de João), e o e-mail está na lista acima do das 10:57.

## 4. Runtime: o alarme de 5xx (spec §7, item 3)

Antes do `set-alarm-state`, o `lotus-site-5xx` lido em `OK` às 13:55:26Z, no estado da criação
(12:53:21.956Z, razão sem ponto, §1.4). Depois, executado por Claude, com a autorização de João dada
neste passo: "Autorizo o set-alarm-state do lotus-site-5xx." Às 13:56:01Z:

```bash
aws cloudwatch set-alarm-state --region us-east-1 --alarm-name lotus-site-5xx --state-value ALARM \
  --state-reason "Prova de B6 (spec de 7.2.6, D12): caminho alarme, SNS, e-mail"
```

Histórico do `lotus-site-5xx`:

```text
== StateUpdate
2026-10-06T13:57:15.523000+00:00  Alarm updated from ALARM to OK  Threshold Crossed: 1 out of the last 1 datapoints [0.0 (06/10/26 13:52:00)] was not greater than the threshold (0.5) (minimum 1 datapoint for ALARM -> OK transition).
2026-10-06T13:56:04.122000+00:00  Alarm updated from OK to ALARM  Prova de B6 (spec de 7.2.6, D12): caminho alarme, SNS, e-mail
2026-10-06T12:53:21.956000+00:00  Alarm updated from INSUFFICIENT_DATA to OK  Threshold Crossed: no datapoints were received for 1 period and 1 missing datapoint was treated as [NonBreaching].
== Action
2026-10-06T13:57:15.568000+00:00  Successfully executed action arn:aws:sns:us-east-1:760144413534:lotus-site-alertas
2026-10-06T13:56:04.178000+00:00  Successfully executed action arn:aws:sns:us-east-1:760144413534:lotus-site-alertas
2026-10-06T12:53:21.991000+00:00  Successfully executed action arn:aws:sns:us-east-1:760144413534:lotus-site-alertas
```

O alarme voltou sozinho ao estado real em 71 s, na avaliação seguinte, com uma ação no tópico em
cada transição. Razão do estado no `describe-alarms`: `Threshold Crossed: 1 out of the last 1
datapoints [0.0 (06/10/26 13:52:00)] was not greater than the threshold (0.5)`. Cita ponto real: o
alarme lê dado. O ponto é de cinco minutos antes da avaliação (13:57:15): a CloudFront publica a
métrica com atraso, e o alarme avalia o ponto mais recente que já existe; um 5xx real chega ao alarme
com esse atraso.

Os dois e-mails chegaram a `jv***@gmail.com`, na caixa de entrada (aba Principal), declarados por
João com o print da lista de mensagens, remetente `lotus-site`: `ALARM: "lotus-site-5xx" in US East
(N. Virginia)` às 10:56 no relógio de João (13:56Z) e `OK: "lotus-site-5xx" in US East (N.
Virginia)` às 10:57 (13:57Z). Batem com as duas publicações no tópico, às 13:56:04Z e 13:57:15Z.

As `Metrics` do alarme implantado:

```text
m1 Requests Sum DistributionId=E1R7SPH4OLUIEQ,Region=Global
m2 5xxErrorRate Average DistributionId=E1R7SPH4OLUIEQ,Region=Global
e1 m1 * m2 / 100
```

A mesma consulta em `get-metric-data`, de 2026-10-05T14:00:13Z a 2026-10-06T14:00:13Z:

```text
|  Estado  | Maximo   | Pontos   |
|  Complete|  0.0     |  244     |
```

Do primeiro ponto (2026-10-05T14:14Z) ao último (2026-10-06T13:59Z), nenhum acima de `0.5` e nenhum
diferente de zero: nenhum 5xx nas últimas 24 h. Desde 12:52, quando o health check começou, 68
pontos, um por minuto, sem falta.

## 5. Deploy: a role de alerta e as catracas (spec §7, item 4)

As três simulações da `lotus-site-alerta` (`simulate-principal-policy`, com `aws:RequestedRegion`
no contexto):

| Ação            | Recurso                                                 | Decisão        | Organizações |
| --------------- | ------------------------------------------------------- | -------------- | ------------ |
| `sns:Publish`   | `arn:aws:sns:us-east-1:760144413534:lotus-site-alertas` | `allowed`      | vazio        |
| `sns:Publish`   | `arn:aws:sns:sa-east-1:760144413534:lotus-alertas`      | `implicitDeny` | vazio        |
| `sns:Subscribe` | `arn:aws:sns:us-east-1:760144413534:lotus-site-alertas` | `implicitDeny` | vazio        |

Só publica, e só no tópico do site. `Organizações` vazio é o normal nesta conta; nenhuma SCP negando.
O simulador pode diferir do ambiente real: a chamada de verdade é `D-68`.

A trust da `lotus-site-alerta` é igual à da `lotus-site-deploy` (comparadas com `jq -S`):
`sts:AssumeRoleWithWebIdentity` pelo provedor
`arn:aws:iam::760144413534:oidc-provider/token.actions.githubusercontent.com`, com `aud`
`sts.amazonaws.com` e os dois `sub` de `main` do corporativo:

```text
repo:Gatika-CL/lotus-site:ref:refs/heads/main
repo:Gatika-CL@310231788/lotus-site@1357439884:ref:refs/heads/main
```

As variáveis do corporativo, lidas às 14:01:00Z (`gh variable list --repo Gatika-CL/lotus-site`):
`AWS_ALERT_ROLE_ARN` e `AWS_ALERT_TOPIC_ARN` ausentes; as seis que existem são de blocos anteriores.
João decidiu criá-las agora, ele mesmo (spec D14). Relidas em 2026-10-07T00:50:46Z:

```text
AWS_ALERT_ROLE_ARN   arn:aws:iam::760144413534:role/lotus-site-alerta      2026-10-07T00:48:18Z
AWS_ALERT_TOPIC_ARN  arn:aws:sns:us-east-1:760144413534:lotus-site-alertas  2026-10-07T00:48:36Z
```

Os dois valores batem, caractere por caractere, com os outputs `ArnDoPapelDeAlerta` e `ArnDoTopico`
da §1. As outras seis variáveis seguem como estavam. Nada as lê ainda: o `ci.yml` do corporativo só
ganha o job `alerta` no primeiro espelho depois do merge.

As catracas no último `vitest` (14:01:57Z): `scripts/infra/observabilidade.test.mjs` 47/47,
`scripts/infra/ci-alerta.test.mjs` 22/22 e `scripts/infra/yaml.test.mjs` 20/20.

## 6. Log gravado (spec §7, item 5)

## 7. Log lido e a primeira medição de `D-66` (spec §7, item 6)

## Limites declarados (spec §7)
