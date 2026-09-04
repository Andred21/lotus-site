# ADR-SITE-004 · Hospedagem é S3 privado atrás de CloudFront, publicado por CD

- **Status:** aceito
- **Data:** 2026-09-03
- **Escopo:** bloco `7.1.1+7.1.2+7.1.5`
- **Substitui:** nada. **Não** substitui o `ADR-SITE-003`, que é sobre o intake do contato.

## Nota de numeração

O Notion nomeia esta decisão de `ADR-SITE-003` no título da EAP `7.1.1`, e o campo `ADR ref` das
doze EAP das Sprints 6 e 7 aponta para o mesmo número. `docs/adr/ADR-SITE-003.md` existe desde
2026-08-29 e é "O intake do contato é um módulo, não quatro". A divergência é de numeração, não de
conteúdo: esta decisão é a `ADR-SITE-004`. Corrigir o campo no Notion está autorizado e acontece
depois deste arquivo existir (`D-34`).

## Nota de vocabulário

O critério de aceite pede "runtime de Server Actions". A descrição da task compara Vercel como
padrão para Next.js. O repositório é Vite SPA desde `1.2.1`; não há Server Action nem servidor de
aplicação para ter runtime. A propriedade que o critério quer — onde o código roda e o que isso
custa operar — está respondida abaixo em **Runtime: estático, sem servidor**. A correção do texto
no Notion é parte do `D-34`.

## Contexto

O clone de `https://lotusotec.cl/` está funcional e coberto por `pnpm check` e `pnpm e2e` desde
`1.3.7`, e não tem endereço. O site em produção é WordPress na BlueHosting, com a zona DNS na
StackDNS e o e-mail em Google Workspace (medido em 2026-09-03). A conta AWS é a mesma que o projeto
`lotus` usa, com teto de US$ 30/mês já decidido.

O produto é um bundle estático: um `index.html`, assets com hash no nome, nenhuma rota de servidor,
nenhum estado no servidor. O formulário de contato fala com a Web3Forms direto do navegador
(`ADR-SITE-002`).

## Decisão

Bucket S3 **privado** em `sa-east-1`, servido por uma distribuição CloudFront com Origin Access
Control. Publicação por CD: o CI do repositório corporativo `Gatika-CL/lotus-site` constrói e
publica, assumindo uma role por OIDC. Nenhum segredo de longa duração em nenhum repositório.

O ambiente é descrito em CloudFormation (`infra/lotus-site.yaml`, `infra/lotus-oidc-github.yaml`),
não em cliques de console: ambiente criado por clique não produz diff, e revisão sem diff é
relatório.

Um ambiente só. Ele é staging enquanto o DNS não aponta para ele, e vira produção em `7.2.5` quando
apontar — o corte remove o `X-Robots-Tag` e acrescenta o domínio; não troca de recurso.

## Runtime: estático, sem servidor

Não há processo nosso rodando em lugar nenhum. O que existe é objeto em bucket e cache em borda.

Consequências que interessam: não há patch de sistema operacional, não há reinício, não há
autoscaling, não há custo por ociosidade, e o modo de falha "aplicação caiu" não existe — o pior
caso é objeto errado publicado, que o rollback abaixo desfaz em um comando. Em troca, nada que
precise de servidor cabe aqui sem mudar a decisão: renderização no servidor, webhook, cron e
segredo que não possa ir para o navegador exigiriam outra peça (Lambda@Edge, CloudFront Function ou
um serviço fora do bloco), e essa peça precisaria do seu próprio ADR.

## Custo

Estimativa, não medição — o clone ainda não recebe tráfego (spec §9). Os preços unitários não foram
reconsultados neste bloco; o que torna a estimativa segura é o teto, não a precisão dela.

| Item                     | Grandeza medida                                                     | Efeito na conta                                                        |
| ------------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Armazenamento S3         | `dist/` = 1136393 B em 21 objetos                                   | fração de centavo por mês, mesmo guardando dezenas de releases por SHA |
| Requisições S3           | ~2 × 21 PUT por deploy                                              | irrelevante na escala de deploys por dia                               |
| Transferência CloudFront | free tier perpétuo de 1 TB/mês de saída e 10 milhões de requisições | zero enquanto o site for staging sem tráfego                           |
| Invalidações             | 3 caminhos por deploy; as 1.000 primeiras do mês são gratuitas      | zero, por desenho — ver `#Rollback`                                    |

**A guarda é o `AWS::Budgets::Budget` de US$ 30 do próprio stack**, filtrado nos serviços S3 e
CloudFront, com alerta em 80% do previsto. Filtro por serviço e não por tag: tag de alocação de
custo precisa ser ativada no painel de billing e leva até 24h para valer, e um budget que não mede
nada é pior que nenhum.

`PriceClass_100` (Estados Unidos, Canadá, Europa e Israel) exclui a borda da América do Sul. É a
opção mais barata e serve o mundo inteiro — o visitante chileno é atendido por uma borda do
hemisfério norte, com latência maior. Aceitável enquanto o endereço é de homologação; revisar no
corte de DNS (`D-39`).

## Operação

| Ação                         | Quem              | Como                                                                                                                                        |
| ---------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Criar ou alterar o ambiente  | João              | `aws cloudformation deploy` seguindo `docs/infra/runbook-aws.md`. O agente escreve o template e cria o change set; quem executa é a pessoa. |
| Promover código para release | João              | `scripts/espelhar-corporativo.sh`, que se recusa a espelhar commit sem CI verde                                                             |
| Publicar                     | CI do corporativo | job `deploy`, sem intervenção                                                                                                               |
| Rollback                     | João              | um `aws s3 sync` mais uma invalidação — ver abaixo                                                                                          |
| Aprovar merge                | João              | o agente nunca faz merge                                                                                                                    |

Nada no repositório pessoal `Andred21/lotus-site` — que é público — tem credencial de AWS.

## Logs

O que existe hoje, de propósito:

- **CloudTrail management events.** Ligado por padrão na conta, 90 dias de histórico, sem custo.
  Responde "quem mudou o quê" — inclusive cada `AssumeRoleWithWebIdentity` do CI, com o `sub` do
  token, que é o rastro de qual repositório e qual branch publicaram.
- **O run do GitHub Actions.** Guarda o log do build e do deploy por 90 dias, ligado ao SHA.
- **`releases/<sha>/` no bucket.** O artefato de cada publicação fica guardado; comparar o que está
  no ar com o que foi construído é um `aws s3 ls`.

O que **não** existe: access log do CloudFront. Ligá-lo hoje criaria volume de objetos com custo de
armazenamento e nenhum consumidor — não há dashboard, alerta nem consulta que os leia. Entra em
`7.2.6` (observabilidade), junto com quem vai lê-los (`D-40`).

## Rollback

Cada deploy escreve `releases/<sha>/` **antes** de tocar a raiz do bucket. Voltar é pôr um release
antigo de volta na raiz — sem rebuild, sem CI, sem tocar em CloudFormation:

```bash
BALDE=lotus-site-prod
SHA_ANTERIOR=<sha do commit de espelho que estava no ar>
ID=<id da distribuição>

aws s3 ls "s3://$BALDE/releases/"                       # confere que o prefixo existe

VOLTA=$(mktemp -d)
aws s3 sync "s3://$BALDE/releases/$SHA_ANTERIOR/" "$VOLTA/"

aws s3 sync "$VOLTA/" "s3://$BALDE/" --delete \
  --exclude "releases/*" \
  --exclude "index.html" --exclude "robots.txt" --exclude "sitemap.xml" \
  --cache-control "public, max-age=31536000, immutable"

aws s3 sync "$VOLTA/" "s3://$BALDE/" \
  --exclude "*" \
  --include "index.html" --include "robots.txt" --include "sitemap.xml" \
  --cache-control "no-cache"

rm -rf "$VOLTA"

aws cloudfront create-invalidation --distribution-id "$ID" \
  --paths /index.html /robots.txt /sitemap.xml
```

**A descida para o disco não é desperdício, é o que faz o comando funcionar.** Numa cópia
servidor-a-servidor as chaves que `--exclude "releases/*"` precisa proteger no destino são
exatamente as chaves da origem — a mesma string — e nenhum padrão de filtro separa as duas.
Medido em 2026-09-04 contra o bucket real, com 21 objetos:

| Comando                                                             | Copiou | Apagou |
| ------------------------------------------------------------------- | ------ | ------ |
| `sync s3://B/releases/<sha>/ s3://B/ --delete --exclude releases/*` | 0      | 0      |
| o mesmo, sem o `--exclude`                                          | 21     | 21     |
| o mesmo, com `--exclude "*/releases/*"`                             | 21     | 21     |
| `sync <dir local>/ s3://B/ --delete --exclude releases/*`           | 21     | 0      |

A primeira linha é um no-op: o site nunca seria republicado. A segunda e a terceira apagam o
histórico inteiro de releases, e o rollback seguinte não teria de onde vir. Só a quarta faz as
duas coisas certas. Emenda **E3** da spec, autorizada por João em 2026-09-04.

O `Cache-Control` é reescrito nos dois passos porque, sem cópia servidor-a-servidor, não há
metadado de origem para preservar. É a mesma divisão em dois passos que o job `deploy` usa.

A invalidação lista três caminhos e não `/*` porque todo o resto sai do Vite com hash no nome —
asset novo tem URL nova e não precisa ser invalidado. Invalidar `/*` a cada deploy é o que faz a
conta de CloudFront crescer sem motivo.

É procedimento, não botão: não há automação e não há teste automático dele (`D-37`). É exercitado
uma vez, à mão, na execução deste bloco.

## Domínio

`lotusotec.cl` **não** é tocado aqui. O endereço publicado é o domínio do CloudFront.

O motivo de o domínio ficar para `7.2.1` foi medido em 2026-09-03: a zona está na
StackDNS/BlueHosting e João só tem a tela de _nameservers_, sem editor de registros. Sem editor não
há como criar o CNAME que a validação do ACM exige, e sem certificado não há domínio próprio no
CloudFront. A ordem obrigatória, portanto, é: migrar a zona (ou obter um editor) → emitir o
certificado em `us-east-1` → só então apontar o domínio.

Trocar os nameservers é seguro porque a zona não tem DNSSEC — também medido. E é arriscado por
outro motivo: o MX é Google Workspace, e um registro esquecido na cópia derruba o e-mail da
empresa. `7.2.1` começa pedindo o export BIND ao suporte.

## Motivo da decisão

Quatro opções foram consideradas.

**Vercel** — o que a descrição da task no Notion supunha. Saiu porque a premissa saiu: ela é o
caminho curto para Next.js, e o repositório é Vite SPA. Para um bundle estático ela não acrescenta
nada sobre o CloudFront, e acrescenta uma conta, um fornecedor e uma fatura fora da conta AWS que o
teto de US$ 30 vigia.

**AWS Amplify Hosting** — faz build e deploy com pouca configuração. Saiu por duas razões: ele quer
uma conexão de app do GitHub com permissão de leitura no repositório, o que atravessa a fronteira
pessoal/corporativo que o espelho existe para manter; e a configuração vive no console, o que
recria exatamente o problema que o CloudFormation resolve — ambiente sem diff não é revisável.

**Bucket S3 com website endpoint público** — o mais simples e o mais barato. Saiu porque o website
endpoint é HTTP puro, não aceita OAC e obriga o bucket a ser público. HTTPS deixaria de ser
garantido e a superfície pública deixaria de ser uma só.

**S3 privado + CloudFront com OAC — escolhida.** O bucket fica fechado nos quatro bloqueios de
acesso público; a única porta é a distribuição, e a política do bucket só aceita o principal do
CloudFront com o ARN desta distribuição. HTTPS é obrigatório (`redirect-to-https`), a compressão é
do CloudFront, o custo cabe no free tier, e o ambiente inteiro é um arquivo de texto revisável
antes de existir.

## Consequências

- O que vai para o ar é o mesmo `pnpm build` que o CI já roda em PR. Não há flag de ambiente nem
  variável que mude o bundle entre "staging" e "produção" — a diferença é um cabeçalho de resposta
  e, depois, um domínio.
- Enquanto o endereço for do CloudFront, **toda** resposta carrega `X-Robots-Tag: noindex,
nofollow`, aplicado pela distribuição. Isso cobre o que o `robots.txt` não cobre — um
  `robots.txt` proíbe rastrear, não indexar — e some em `7.2.5` removendo uma linha da política,
  sem tocar em `public/`.
- Caminho inexistente devolve **404**, não `index.html` com 200. Não há rota de cliente para
  salvar: `#Somos` e `#Cursos` são fragmentos, que nunca chegam ao CloudFront.
- A role de deploy está presa a `repo:Gatika-CL/lotus-site:ref:refs/heads/main` com `StringEquals`.
  Publicar a partir de outra branch ou de uma tag exige editar o stack, de propósito (`D-38`).
- O bucket nasce com versionamento e `DeletionPolicy: Retain`. `delete-stack` derruba distribuição,
  role e budget; o bucket e o histórico de releases sobrevivem e exigem remoção explícita.
