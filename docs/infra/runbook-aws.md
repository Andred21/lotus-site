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

1. ~~Recuperar o acesso ao painel~~ — **feito**. João confirmou em 2026-09-20 que tem acesso à
   tela de nameservers (`D-44` fechado). É declaração, não medição nossa: quem executar a troca
   comprova na hora.
2. ~~Pedir o export BIND da zona~~ — **deixou de ser necessário.** Com wildcard na zona (`D-45`),
   enumerar por DNS devolvia resposta para qualquer palpite; os prints do painel do StackCP, de
   2026-09-20, listam o que existe e fecharam o inventário com a mesma autoridade (`D-45`
   fechado).

A EAP `7.2.1` cobre da criação da zona até o HTTPS válido. O bloco de 2026-09-20 criou e conferiu
a zona; a rodada de 2026-09-26 trocou a delegação (6.4) e emitiu o certificado (6.6). Falta o alias
do CloudFront, que é `B5` (`D-47`).

Em paralelo, e num lugar diferente: abrir o pedido de **production access do SES** no suporte da
**AWS** — não no da BlueHosting. Ele tem espera e trava `B2` se ficar para depois.

### 6.1 Criar e popular a zona

A zona é um stack, `infra/lotus-dns.yaml`, e não uma sequência de `change-resource-record-sets`.
Editar registros à mão funciona e **é desfeito pelo próximo deploy**: o template é a fonte.

```bash
export AWS_PROFILE=lotus

aws cloudformation deploy \
  --region us-east-1 \
  --stack-name lotus-dns \
  --template-file infra/lotus-dns.yaml \
  --tags Projeto=lotus-site

aws cloudformation describe-stacks --region us-east-1 --stack-name lotus-dns \
  --query 'Stacks[0].Outputs' --output table
```

`us-east-1` de propósito, embora o Route 53 seja global: o certificado de 6.6 entra neste mesmo
stack, e o CloudFront só lê certificado de lá.

O output `NameServers` traz os quatro `ns-*.awsdns-*` que vão para o registrador no passo 6.4.
`IdDaZona` é a entrada de `list-resource-record-sets`.

Três regras que o template já aplica e que edição manual não deve desfazer:

- **O MX do Google entra idêntico.** É o e-mail da empresa.
- **O wildcard `*` não entra.** `www` e `sistema`, que hoje só respondem por causa dele, nascem
  explícitos. O inventário do painel revelou mais um nessa situação, `pop3`, que entrou como
  registro explícito; nome que aparecer depois segue o mesmo caminho, um a um — não um wildcard de
  volta.
- **O apontamento para o CloudFront não entra agora.** `B1` move a zona sem mudar o que ela
  responde; apontar o site é `B5`.

A catraca `scripts/infra/zona.test.mjs` roda em `pnpm check` e reprova se qualquer uma das três
for violada no template.

### 6.3 Conferir antes de trocar

```bash
pnpm infra:conferir-zona
```

Pergunta direto aos quatro nameservers da zona nova — consulta comum devolveria o lado antigo,
porque a delegação ainda aponta para a StackDNS —, compara com esse lado atual por
DNS-over-HTTPS, grava `docs/infra/conferencia-zona-<data>.md` e sai 1 na primeira divergência não
esperada.

A única divergência esperada: nome inventado não resolve na AWS e resolve na StackDNS. É a prova
de que o wildcard não atravessou.

Se UDP/53 não sair da máquina, o lado AWS cai para `route53 list-resource-record-sets` e o
relatório **declara a troca no cabeçalho**: configuração escrita não é resposta servida.

Diferença aqui é barata; diferença depois do passo 6.4 é serviço fora do ar para parte do mundo.

Depois da troca, a mesma conferência roda com `--pos-delegacao`:

```bash
pnpm infra:conferir-zona --pos-delegacao \
  --saida "docs/infra/conferencia-zona-$(date +%F)-pos-delegacao.md"
```

O modo inverte os dois vereditos que a delegação inverte: a linha `NS` passa a esperar os
nameservers do próprio stack, e o nome inventado passa a ter de não resolver em lado nenhum — os
dois lados são a mesma zona agora, e a assimetria de antes deixou de ser possível.

### 6.4 Trocar os nameservers

**Feito em 2026-09-26.** Evidência em `docs/infra/delegacao-2026-09-26.md`: print do painel antes,
whois do NIC Chile depois, convergência medida e prova de saída de e-mail com `SPF: PASS`. A prova
de entrada — mensagem de fora chegando em `contacto@` — está pendente de confirmação com o dono da
caixa. A zona da StackDNS continua de pé — é o rollback, e desligá-la é `B7`.

No painel do registrador, substituir `ns1..ns4.stackdns.com` pelos quatro `ns-*.awsdns-*`.

Quem manda no tempo de convergência é o TTL da delegação no registro `.cl`, que não controlamos e
costuma ser de horas a dois dias. Nesse intervalo resolvedores diferentes leem servidores
diferentes — por isso o passo 6.3 existe.

Não peça remoção da zona antiga enquanto a convergência não terminar.

### 6.5 Provar que o e-mail sobreviveu

Resolução correta não prova entrega. Depois da convergência:

```bash
curl -s 'https://dns.google/resolve?name=lotusotec.cl&type=MX' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print("\n".join(sorted(a["data"] for a in d.get("Answer",[]) if a["type"]==15)))'
curl -s 'https://dns.google/resolve?name=lotusotec.cl&type=TXT' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print("\n".join(a["data"] for a in d.get("Answer",[]) if a["type"]==16))'
```

E então **enviar uma mensagem de fora para uma caixa `@lotusotec.cl` e confirmar que chegou**. Essa
é a prova de aceite do bloco, não o `dig`.

### 6.6 Certificado no ACM

**Emitido em 2026-09-26**, pelo recurso do template (commit `60dd2c2`). `Status: ISSUED`, para
`lotusotec.cl` e `www.lotusotec.cl`, válido até 2027-04-11 — 198 dias, o teto do ACM para
certificado público. O ARN sai no output `ArnDoCertificado` e é consumido por `B5` como parâmetro,
não por `ImportValue`. A renovação só fica automática quando o certificado estiver em uso:
`RenewalEligibility` é `INELIGIBLE` até `B5` ligá-lo à distribuição.

**Só depois de 6.4.** A validação DNS-01 precisa que o mundo leia a zona da AWS; com a delegação
ainda na StackDNS, o CNAME de validação existe e ninguém o enxerga.

Caminho padrão: um `AWS::CertificateManager::Certificate` no stack `lotus-dns`, com
`DomainValidationOptions.HostedZoneId` apontando para a própria zona — o ACM cria o CNAME de
validação sozinho, e ele fica na zona, não é removido depois. A renovação só é automática e
silenciosa quando o certificado estiver em uso (`RenewalEligibility: INELIGIBLE` até `B5`).

```yaml
Certificado:
  Type: AWS::CertificateManager::Certificate
  Properties:
    DomainName: !Ref NomeDaZona
    SubjectAlternativeNames:
      - !Sub 'www.${NomeDaZona}'
    ValidationMethod: DNS
    DomainValidationOptions:
      - DomainName: !Ref NomeDaZona
        HostedZoneId: !Ref Zona
      - DomainName: !Sub 'www.${NomeDaZona}'
        HostedZoneId: !Ref Zona
```

SANs explícitos, **nunca** `*.lotusotec.cl`: o wildcard amplia o raio de uma chave comprometida e
esconde o inventário de nomes.

Três armadilhas, todas de ordem:

1. **Pedido pendente do ACM é cancelado em 72h.** Pedir antes de a delegação funcionar queima o
   pedido.
2. **Com `HostedZoneId`, o stack fica em `CREATE_IN_PROGRESS` até validar.** Zona não delegada
   significa stack travado até o timeout, e depois rollback.
3. **`CAA` restringindo emissão a `amazon.com` entra depois do primeiro `ISSUED`, nunca antes.**
   CAA errado bloqueia a própria renovação. A zona não tem CAA hoje (medido em 2026-09-09), e é
   por isso que o ACM emite sem obstáculo.

**O caminho acima é o que está em uso.** O que vem abaixo é fallback declarado, nunca executado até
aqui, e um certificado emitido por ele **não** seria gerenciado pelo stack — o próximo deploy
tentaria criar outro. Se as duas descrições divergirem, a do template vence (`D-48`).

Fallback declarado, para o caso de o recurso do template travar e ser preciso emitir à mão:

```bash
aws acm request-certificate --region us-east-1 \
  --domain-name lotusotec.cl \
  --subject-alternative-names www.lotusotec.cl \
  --validation-method DNS \
  --query CertificateArn --output text

aws acm describe-certificate --region us-east-1 --certificate-arn <arn> \
  --query 'Certificate.DomainValidationOptions[].ResourceRecord'

aws acm wait certificate-validated --region us-east-1 --certificate-arn <arn>
```

### 6.7 Subdomínios

Com a zona no Route 53 não há limite de um subdomínio. `sistema.lotusotec.cl` e `www.lotusotec.cl`
já nascem no template como `A` **e** `AAAA` para o WordPress. Nenhum dos dois é registro no painel
antigo — o inventário fechado de 2026-09-20 prova isso —, e os dois só resolviam por causa do
wildcard, que não atravessou.

Subdomínio novo é uma entrada a mais em `RecordSets` **e** uma linha a mais no inventário de
`scripts/infra/lib/zona.mjs`, senão a catraca reprova. Não é `change-resource-record-sets` à mão.

Criar esse registro é DNS e nada mais. A integração com a API do Lotus (`8.2.1`) está congelada
por decisão de João em 2026-09-09 e não é aberta por este comando.

### 6.8 Budget

**Feito em `7.2.1`.** `CostFilters.Service` em `infra/lotus-site.yaml` lista
`Amazon Simple Storage Service`, `Amazon CloudFront` e `Amazon Route 53`. SES e Lambda entram no
mesmo lugar em `B2`.

O filtro é da **conta**, não do stack: a zona `komit.cl`, que já existia nesta conta antes de nós,
passa a ser contada também.

```bash
aws budgets describe-budget --region us-east-1 --account-id 760144413534 \
  --budget-name lotus-site-teto --query 'Budget.CostFilters' --output json
```

### 6.9 Desmontar a zona (leia antes de pensar em fazer)

`delete-stack` de `lotus-dns` **não apaga a zona**: `DeletionPolicy: Retain` a deixa para trás, de
propósito. Apagá-la é um ato manual e separado:

```bash
aws route53 delete-hosted-zone --id <IdDaZona>
```

Uma hosted zone recriada ganha **nameservers novos**. Se a zona já estiver delegada nessa altura,
apagá-la derruba o site e o e-mail corporativo no mesmo movimento, e recriá-la não conserta — é
preciso voltar ao painel do registrador com os quatro nomes novos e esperar a propagação outra
vez.

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
