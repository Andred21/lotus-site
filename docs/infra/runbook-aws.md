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

## 5. Prova de aceite

Ver a secção correspondente do plano do bloco. Em resumo: a home responde 200 com
`X-Robots-Tag`, um caminho inventado responde 404, o bucket responde 403 quando acessado direto, e
os quatro bloqueios de acesso público estão ligados.

## 6. Desmonte

```bash
aws cloudformation delete-stack --stack-name lotus-site
aws cloudformation wait stack-delete-complete --stack-name lotus-site
```

Isso derruba distribuição, política de cabeçalhos, OAC, role e budget. O **bucket sobrevive**, por
`DeletionPolicy: Retain`, com todos os releases. Para removê-lo também:

```bash
aws s3 rm "s3://<nome-do-bucket>" --recursive
aws s3api delete-objects --bucket <nome-do-bucket> --delete "$(aws s3api list-object-versions \
  --bucket <nome-do-bucket> --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' --output json)"
aws s3 rb "s3://<nome-do-bucket>"
```

O segundo comando existe porque o bucket é versionado: `rm --recursive` cria delete markers e deixa
as versões antigas para trás, e o `rb` recusa bucket não vazio.
