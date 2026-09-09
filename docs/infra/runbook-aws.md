# Runbook — provisionar e operar o ambiente AWS do lotus-site

> Quem executa os comandos desta página é o João, no terminal dele ou no CloudShell. O agente
> escreve os templates, valida estrutura e cria change set; **não** executa change set e **não**
> cria recurso. Decisão de 2026-09-03.
>
> Decisão registrada em [`ADR-SITE-004`](../adr/ADR-SITE-004.md). Rollback está lá, não aqui.

## 0. Pré-requisitos

- `aws --version` responde 2.x.
- Credencial do usuário IAM `lotus-infra` configurada **no profile `lotus`**. Medido em
  2026-09-04: nesta máquina o profile `default` carrega uma chave que responde
  `InvalidClientTokenId`, e a válida está em `lotus`. Todo comando desta página assume
  `export AWS_PROFILE=lotus`, ou o `--profile lotus` equivalente.
- Repositório `Gatika-CL/lotus-site` criado, privado e vazio.

**Antes de colocar uma chave nova nesta máquina**, corrija as permissões — em WSL sobre ext4 os
arquivos nascem `0777`:

```bash
chmod 700 ~/.aws
chmod 600 ~/.aws/config ~/.aws/credentials 2>/dev/null || true
ls -ld ~/.aws; ls -l ~/.aws
```

Só então `aws configure`. Nunca cole a secret access key num arquivo do repositório, num commit,
numa mensagem de chat ou na saída de um comando.

## 1. Descarregar o risco das SCPs

A `lotus-infra` declarou, e ninguém descarregou ainda, que as SCPs da organização dona da conta são
desconhecidas. Primeira coisa a rodar numa sessão autenticada:

```bash
aws sts get-caller-identity
aws organizations describe-organization
```

`AccessDenied` **também é resposta** e encerra o risco: registre qual das duas veio, com a data, na
sessão. Se vier uma organização, confira se há SCP negando `cloudfront:*`, `s3:*` ou `budgets:*`
antes de seguir.

## 2. Ordem dos stacks

O provedor OIDC vem primeiro: a role não pode ser criada antes de ele existir.

```bash
export AWS_PROFILE=lotus
export AWS_REGION=sa-east-1

aws cloudformation validate-template \
  --template-body file://infra/lotus-oidc-github.yaml

aws cloudformation deploy \
  --stack-name lotus-oidc-github \
  --template-file infra/lotus-oidc-github.yaml \
  --capabilities CAPABILITY_NAMED_IAM
```

Se a conta **já tiver** um provedor para `token.actions.githubusercontent.com` — o `lotus` pode
tê-lo criado —, o deploy falha com `EntityAlreadyExists`. Nesse caso não crie outro: importe o
recurso existente ou pule este stack; o provedor é um por conta e o stack do site não depende do
export dele.

## 3. Stack do site

```bash
aws cloudformation validate-template \
  --template-body file://infra/lotus-site.yaml

# Change set: mostra o que aconteceria, sem que nada aconteça.
aws cloudformation deploy \
  --stack-name lotus-site \
  --template-file infra/lotus-site.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides EmailDeAlerta=<seu-email> \
  --no-execute-changeset
```

O comando imprime um `aws cloudformation describe-change-set --change-set-name arn:…`. **Leia o
change set antes de executar.** Depois:

```bash
aws cloudformation execute-change-set --change-set-name <arn impresso acima>
aws cloudformation wait stack-create-complete --stack-name lotus-site
aws cloudformation describe-stacks --stack-name lotus-site \
  --query "Stacks[0].Outputs" --output table
```

### Se o nome do bucket estiver tomado

`lotus-site-prod` está num namespace **global**. Se o deploy falhar com
`BucketAlreadyExists`, repita passando o nome alternativo já decidido:

```bash
--parameter-overrides NomeDoBucket=lotus-site-prod-$(aws sts get-caller-identity --query Account --output text) EmailDeAlerta=<seu-email>
```

### Se o budget for recusado em sa-east-1

A API de Budgets é global com endpoint em `us-east-1`. Se o recurso `Teto` falhar, remova-o de
`infra/lotus-site.yaml`, reimplante, e crie um stack só para ele em `us-east-1`. Não afirme que
funcionou sem ter rodado.

## 4. Variáveis de repositório no corporativo

Com os Outputs em mãos, em `Gatika-CL/lotus-site` → Settings → Secrets and variables → Actions →
**Variables** (não Secrets: nenhum destes é segredo, e variável aparece no log, o que ajuda a
depurar):

| Variável              | Vem de                        |
| --------------------- | ----------------------------- |
| `AWS_DEPLOY_ROLE_ARN` | Output `ArnDoPapelDeDeploy`   |
| `AWS_BUCKET`          | Output `NomeDoBaldePublicado` |
| `AWS_CLOUDFRONT_ID`   | Output `IdDaDistribuicao`     |
| `ESPELHO_FONTE`       | `Andred21/lotus-site`         |

**Nenhuma delas é criada no repositório pessoal.** A ausência de `AWS_DEPLOY_ROLE_ARN` lá é a
primeira das duas camadas que impedem o pessoal de publicar.

### Se o `deploy` reprovar em `sts:AssumeRoleWithWebIdentity`

```
Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

Antes de mexer em IAM, leia o formato do `sub` que o GitHub realmente emite:

```bash
gh api /repos/Gatika-CL/lotus-site/actions/oidc/customization/sub
```

Medido em 2026-09-04, ele responde `sub_claim_prefix` com identificadores numéricos —
`repo:Gatika-CL@310231788/lotus-site@1357439884` — e não com o nome legível, mesmo com
`use_default: true` e `use_immutable_subject: false`. O token carrega esse prefixo mais
`:ref:refs/heads/main`. Por isso a trust policy da role aceita **duas** strings exatas, uma de cada
formato, no parâmetro `RepositorioDeDeployImutavel`. Se os identificadores da organização ou do
repositório mudarem — repositório recriado, não renomeado —, é esse parâmetro que precisa ser
atualizado.

Não troque `StringEquals` por `StringLike` para contornar isso: curinga em `sub` abre a role para
outras branches e para forks.

### Se o `deploy` reprovar em `cloudfront:GetInvalidation`

```
not authorized to perform: cloudfront:GetInvalidation
```

`aws cloudfront wait invalidation-completed` faz polling com `GetInvalidation`, então a role precisa
das **duas** ações, não só de `CreateInvalidation`. Medido em 2026-09-04: com só uma delas o job
reprova **depois** de já ter publicado no S3, e o passo de limpeza da raiz fica `skipped` — o site
sai no ar, mas arquivos que saíram do build continuam na raiz do bucket.

## 5. Prova de aceite

Ver a secção correspondente do plano do bloco. Em resumo: a home responde 200 com
`X-Robots-Tag`, um caminho inventado responde 404, o bucket responde 403 quando acessado direto, e
os quatro bloqueios de acesso público estão ligados.

## 6. Route 53 — mover a zona de `lotusotec.cl`

Decisão em [`ADR-SITE-006`](../adr/ADR-SITE-006.md). Inventário medido da zona atual em
[`zona-dns-lotusotec.md`](zona-dns-lotusotec.md). Bloco `B1`, EAP `7.2.1`.

**O registro do domínio não move.** A AWS não aceita registro nem transferência de `.cl`. O que
muda de dono é a zona; na BlueHosting fica a tela de nameservers e a renovação.

### 6.0 Antes de qualquer comando

Duas coisas, nesta ordem, e nenhuma delas é AWS:

1. **Recuperar o acesso ao painel** (`https://www.stackcp.com/`, pelo suporte da BlueHosting).
   Sem ele não há como trocar o nameserver, que é o passo que efetivamente move a zona. `D-44`.
2. **Pedir o export BIND da zona** ao mesmo suporte. Com wildcard na zona (`D-45`), enumerar por
   DNS devolve resposta para qualquer palpite, e não há como afirmar que a cópia está completa sem
   o export.

Em paralelo, e num lugar diferente: abrir o pedido de **production access do SES** no suporte da
**AWS** — não no da BlueHosting. Ele tem espera e trava `B2` se ficar para depois.

### 6.1 Criar a zona

```bash
export AWS_PROFILE=lotus

aws route53 create-hosted-zone \
  --name lotusotec.cl \
  --caller-reference "lotus-site-$(date +%s)" \
  --hosted-zone-config Comment="zona do site e do e-mail; ADR-SITE-006"
```

A resposta traz o `Id` da zona e o **delegation set**: os quatro `ns-*.awsdns-*` que vão para o
registrador no passo 6.4. Anote os dois.

### 6.2 Popular a zona

Se o export BIND chegou, o caminho mais curto é o **console**: Route 53 → a zona → _Import zone
file_ → colar o conteúdo. O CLI não tem importador de arquivo de zona.

Sem o export, ou para conferir o que o import fez, cada mudança é um change batch:

```bash
ZONA=Z0123456789ABCDEFGHIJ

cat > /tmp/lote.json <<'JSON'
{
  "Comment": "copia fiel da zona atual - ADR-SITE-006",
  "Changes": [
    { "Action": "UPSERT", "ResourceRecordSet": {
        "Name": "lotusotec.cl.", "Type": "MX", "TTL": 3600,
        "ResourceRecords": [
          {"Value": "1 ASPMX.L.GOOGLE.COM."},
          {"Value": "5 ALT1.ASPMX.L.GOOGLE.COM."},
          {"Value": "5 ALT2.ASPMX.L.GOOGLE.COM."},
          {"Value": "10 ALT3.ASPMX.L.GOOGLE.COM."},
          {"Value": "10 ALT4.ASPMX.L.GOOGLE.COM."}
        ] } }
  ]
}
JSON

aws route53 change-resource-record-sets --hosted-zone-id "$ZONA" --change-batch file:///tmp/lote.json
aws route53 list-resource-record-sets --hosted-zone-id "$ZONA" --output table
```

Regras que valem para esta zona especificamente:

- **O MX do Google entra idêntico.** É o e-mail da empresa.
- **O wildcard `*` não entra.** Se o export revelar nome que só funciona por causa dele, esse nome
  vira registro explícito, um a um.
- **O apontamento para o CloudFront não entra agora.** `B1` move a zona sem mudar o que ela
  responde; apontar o site é `B5`. Durante a propagação os dois lados precisam dar a mesma resposta.

### 6.3 Conferir antes de trocar

Perguntar **direto** aos nameservers da AWS, sem depender da delegação, que ainda aponta para a
StackDNS:

```bash
NS_AWS=ns-XXXX.awsdns-YY.com     # um do delegation set do passo 6.1

for t in A AAAA MX TXT NS SOA; do dig +norec "@$NS_AWS" "$t" lotusotec.cl; done
for n in mail smtp imap autodiscover ftp; do dig +norec "@$NS_AWS" CNAME "$n.lotusotec.cl"; done
```

Cada resposta tem de bater com [`zona-dns-lotusotec.md`](zona-dns-lotusotec.md). Diferença aqui é
barata; diferença depois do passo 6.4 é serviço fora do ar para parte do mundo.

### 6.4 Trocar os nameservers

No painel do registrador, substituir `ns1..ns4.stackdns.com` pelos quatro `ns-*.awsdns-*`.

Quem manda no tempo de convergência é o TTL da delegação no registro `.cl`, que não controlamos e
costuma ser de horas a dois dias. Nesse intervalo resolvedores diferentes leem servidores
diferentes — por isso o passo 6.3 existe.

Não peça remoção da zona antiga enquanto a convergência não terminar.

### 6.5 Provar que o e-mail sobreviveu

Resolução correta não prova entrega. Depois da convergência:

```bash
dig MX lotusotec.cl +short          # os cinco do Google, sem sobra e sem falta
dig TXT lotusotec.cl +short         # o SPF
```

E então **enviar uma mensagem de fora para uma caixa `@lotusotec.cl` e confirmar que chegou**. Essa
é a prova de aceite do bloco, não o `dig`.

### 6.6 Certificado no ACM

`us-east-1` obrigatoriamente: o CloudFront não lê certificado de outra região.

```bash
aws acm request-certificate --region us-east-1 \
  --domain-name lotusotec.cl \
  --subject-alternative-names www.lotusotec.cl \
  --validation-method DNS \
  --query CertificateArn --output text

aws acm describe-certificate --region us-east-1 --certificate-arn <arn> \
  --query 'Certificate.DomainValidationOptions[].ResourceRecord'
```

Criar os CNAME que a resposta pedir, com o mesmo change batch do passo 6.2, e esperar:

```bash
aws acm wait certificate-validated --region us-east-1 --certificate-arn <arn>
```

Este é o passo que o painel antigo impedia: sem editor de registros não havia como criar o CNAME de
validação.

### 6.7 Subdomínios

Com a zona no Route 53 não há limite de um subdomínio. `sistema.lotusotec.cl` nasce como registro
explícito — hoje ele só resolve por causa do wildcard.

```bash
cat > /tmp/sistema.json <<'JSON'
{ "Changes": [ { "Action": "UPSERT", "ResourceRecordSet": {
    "Name": "sistema.lotusotec.cl.", "Type": "A", "TTL": 300,
    "ResourceRecords": [{"Value": "<IP do Lotus administrativo>"}] } } ] }
JSON

aws route53 change-resource-record-sets --hosted-zone-id "$ZONA" --change-batch file:///tmp/sistema.json
```

Criar esse registro é DNS e nada mais. A integração com a API do Lotus (`8.2.1`) está congelada por
decisão de João em 2026-09-09 e não é aberta por este comando.

### 6.8 Budget

O `AWS::Budgets::Budget` de `infra/lotus-site.yaml` filtra hoje S3 e CloudFront. Assim que a zona
existir, o teto de US$ 30 deixa de medir parte da conta. Incluir Route 53 no filtro é entrega de
`B1` — e SES e Lambda entram no mesmo lugar em `B2`.

## 7. Desmonte

```bash
aws cloudformation delete-stack --stack-name lotus-site
aws cloudformation wait stack-delete-complete --stack-name lotus-site
```

Isso derruba distribuição, política de cabeçalhos, OAC, role e budget. O **bucket sobrevive**, por
`DeletionPolicy: Retain`, com todos os releases. Para removê-lo também:

```bash
BALDE=<nome-do-bucket>

# O bucket é versionado, e isso muda tudo aqui. `aws s3 rm --recursive` não
# apaga nada: só empilha delete marker sobre cada chave. Some com as duas
# listas -- versões E delete markers -- em lotes de até 1000, que é o limite
# de `delete-objects`. O corte de 1000 é a FATIA JMESPath `[0:1000]`, e não
# `--max-items`: o paginador do CLI aplica o limite pela chave `Versions`, então
# uma lista de delete markers pode vir maior que 1000, o `delete-objects`
# rejeitaria o lote e o laço nunca sairia do lugar. A fatia corta a lista
# depois de montada, seja qual for a paginação. (`--max-keys` não existe neste
# comando no aws-cli v2, conferido em 2.36.38.)
for TIPO in Versions DeleteMarkers; do
  while [ "$(aws s3api list-object-versions --bucket "$BALDE" \
      --query "length(${TIPO} || \`[]\`)" --output text)" != "0" ]; do
    aws s3api delete-objects --bucket "$BALDE" --delete "$(aws s3api list-object-versions \
      --bucket "$BALDE" \
      --query "{Objects: ${TIPO}[0:1000].{Key:Key,VersionId:VersionId}}" --output json)" \
      --output text > /dev/null || break
  done
done

# Precisa responder 0 e 0 antes do `rb`.
aws s3api list-object-versions --bucket "$BALDE" \
  --query '{versoes: length(Versions || `[]`), marcadores: length(DeleteMarkers || `[]`)}'

aws s3 rb "s3://$BALDE"
```

O `|| break` existe para o laço não girar para sempre quando a deleção falhar; a conferência logo
abaixo é que diz se ele terminou o serviço. O laço existe porque o `rb` recusa bucket não vazio, e num bucket versionado "vazio" quer dizer sem
versão **e** sem delete marker. Varrer só `Versions[]` deixa os marcadores para trás e o `rb` falha
depois de o procedimento já ter anunciado remoção completa.
