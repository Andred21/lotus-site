# Inventário da zona DNS de `lotusotec.cl`

> Inventário e medição, não configuração. Este arquivo registra **quais registros existem** na zona
> e **o que eles respondem**, com data e método, para servir de base de conferência antes e depois
> da migração para o Route 53 (`ADR-SITE-006`, bloco `B1`).
>
> Ele **substitui** o export BIND que se esperava do suporte: a secção "Fonte" explica de onde vem
> cada uma das duas autoridades, e "O limite desta transcrição" diz onde elas param.

## Fonte

Duas fontes, com autoridades diferentes.

**O inventário fechado** veio do painel do StackCP em **2026-09-20**: João abriu a tela de
gerenciamento de DNS de `lotusotec.cl` e capturou a lista inteira, do cabeçalho até a linha vazia
de inserção, em dois prints que se sobrepõem em `smtp` — então não há corte no meio. Essa lista tem
a mesma autoridade do export BIND que se esperava do suporte, e o torna desnecessário: o problema
do wildcard (`D-45`) só existe para quem sonda a zona de fora.

**Os valores servidos** foram medidos em **2026-09-09** por DNS-over-HTTPS contra `dns.google`,
porque não há `dig` nesta máquina. Reproduzir uma linha:

```bash
curl -s 'https://dns.google/resolve?name=lotusotec.cl&type=MX' | python3 -m json.tool
```

O painel diz **quais registros existem**; a medição diz **o que eles respondem**. As duas concordam
em tudo que as duas enxergam. O TTL de 3600 vem da medição.

## Delegação

```text
SOA  ns1.stackdns.com. hostmaster.stackdns.com. 1753989299 1800 900 1209600 300
NS   ns1.stackdns.com.   ns2.stackdns.com.   ns3.stackdns.com.   ns4.stackdns.com.
```

O painel é o Stack Control Panel (`https://www.stackcp.com/`), revenda da BlueHosting, onde o
domínio foi comprado. João recuperou o acesso em 2026-09-20 (`D-44` fechado).

## Inventário fechado — o que o painel lista

Transcrito dos prints de 2026-09-20. Esta é a lista **completa**: nome que não está aqui não existe
na zona.

| Nome no painel   | Tipo    | Valor                                                           |
| ---------------- | ------- | --------------------------------------------------------------- |
| `lotusotec.cl`   | `A`     | `185.146.167.195`                                               |
| `lotusotec.cl`   | `AAAA`  | `2a07:7800::195`                                                |
| `*.lotusotec.cl` | `A`     | `185.146.167.195`                                               |
| `*.lotusotec.cl` | `AAAA`  | `2a07:7800::195`                                                |
| `lotusotec.cl`   | `MX`    | `1 ASPMX.L.GOOGLE.COM.`                                         |
| `lotusotec.cl`   | `MX`    | `5 ALT1.ASPMX.L.GOOGLE.COM.`                                    |
| `lotusotec.cl`   | `MX`    | `5 ALT2.ASPMX.L.GOOGLE.COM.`                                    |
| `lotusotec.cl`   | `MX`    | `10 ALT3.ASPMX.L.GOOGLE.COM.`                                   |
| `lotusotec.cl`   | `MX`    | `10 ALT4.ASPMX.L.GOOGLE.COM.`                                   |
| `lotusotec.cl`   | `TXT`   | `v=spf1 include:_spf.google.com include:spf.stackmail.com -all` |
| `mail`           | `CNAME` | `ghs.googlehosted.com.`                                         |
| `smtp`           | `CNAME` | `smtp.stackmail.com.`                                           |
| `imap`           | `CNAME` | `imap.stackmail.com.`                                           |
| `pop3`           | `CNAME` | `pop3.stackmail.com.`                                           |
| `autodiscover`   | `CNAME` | `autodiscover.stackmail.com.`                                   |
| `ftp`            | `CNAME` | `ftp.us.stackcp.com.`                                           |

Mais três CNAME cujo nome contém `://` e `/`, tratados abaixo.

`185.146.167.195` é o WordPress na BlueHosting. Os cinco MX são Google Workspace: é o e-mail
corporativo, e é o registro que mais exige conferência antes e depois da troca de nameserver.

**`mail.lotusotec.cl` já está ocupado.** O MAIL FROM do SES não pode usar esse nome; a
`ADR-SITE-005` reserva `ses.lotusotec.cl`.

### `pop3`, e o que a sondagem não podia saber

A medição de 2026-09-09 perguntou por `pop`, recebeu o IP do apex e concluiu que `pop` não existia
e era o wildcard respondendo. A conclusão estava certa sobre `pop` — ele não está no painel — e
cega para `pop3`, que ninguém perguntou. É exatamente a falha que o export BIND existia para pegar,
e é a prova concreta de que enumerar subdomínio por palpite não fecha inventário.

### `www` e `sistema` não são registro

Nenhum dos dois aparece no painel. Hoje eles resolvem só porque o wildcard existe. A cópia no Route
53 os declara explicitamente **porque** o wildcard não atravessa: sem essas linhas, a troca de
delegação apagaria os dois.

### O wildcard é duplo

```text
*.lotusotec.cl.  A     185.146.167.195
*.lotusotec.cl.  AAAA  2a07:7800::195
```

O inventário de 2026-09-09 só registrou o `A`, porque só o `A` tinha sido perguntado. A consequência
prática é que `www` e `sistema` respondem IPv6 hoje, e por isso os dois ganharam `AAAA` na cópia.

### Os três atalhos do painel, descartados de propósito

| Nome no painel                                 | Valor                     |
| ---------------------------------------------- | ------------------------- |
| `http://phpmyadmin.stackcp.com/.lotusotec.cl`  | `phpmyadmin.stackcp.com.` |
| `https://webbuilder.stackcp.com/.lotusotec.cl` | `webbuilder.stackcp.com.` |
| `https://www.stackcp.com/.lotusotec.cl`        | `cp.stackcp.com.`         |

Nome de host não pode conter `://` nem `/`. São atalhos da interface do StackCP gravados na tabela
de DNS, não registros que algum resolvedor consulte. O Route 53 só os aceitaria com escape octal, e
nada os consultaria mesmo assim. **Não migram**, e o descarte está escrito aqui para que a próxima
conferência não os leia como registro perdido. Morrem junto com o painel, em `B7`.

## Ausências medidas

| Registro                               | Estado         | Consequência                                       |
| -------------------------------------- | -------------- | -------------------------------------------------- |
| `_dmarc.lotusotec.cl` `TXT`            | **não existe** | e-mail sai sem política de alinhamento             |
| `google._domainkey.lotusotec.cl` `TXT` | **não existe** | Google Workspace envia sem assinatura DKIM         |
| `CAA` do apex                          | não existe     | ACM emite sem obstáculo                            |
| DNSSEC                                 | não existe     | troca de nameserver não quebra cadeia de confiança |

As duas primeiras são `D-46`. O `include:spf.stackmail.com` do SPF precisa de decisão junto: o MX é
Google, então esse include ou é resíduo do provedor antigo ou é caminho de envio ainda em uso — e
a diferença importa quando o SES entrar como remetente novo (`B2`).

Ausência de `CAA` é boa notícia agora e dívida depois: um CAA restritivo bloquearia a emissão do
certificado pelo ACM, mas não ter nenhum significa que qualquer CA do mundo pode emitir para este
domínio. Publicar `CAA` é bloco próprio, **depois** do primeiro `ISSUED`.

## O limite desta transcrição

Ela é manual. Se um dia aparecer divergência entre a zona do Route 53 e o painel, a primeira
hipótese é erro de digitação aqui, não registro perdido lá.

## Cópia no Route 53

Desde 2026-09-20 a zona existe também no Route 53, criada pelo stack `lotus-dns`
(`infra/lotus-dns.yaml`, `us-east-1`), **sem delegação**: o registro `.cl` continua apontando para
`ns1..ns4.stackdns.com`, então este arquivo continua descrevendo o que o mundo lê.

A cópia tem três diferenças deliberadas em relação ao painel:

- **não tem wildcard** — `www` e `sistema` viraram registro explícito no lugar dele, com `A` e
  `AAAA`;
- **não declara `NS` nem `SOA`** do apex, que a própria zona gera;
- **não tem os três atalhos do StackCP**, cujos nomes não são nomes de host.

Conferência registro a registro em `conferencia-zona-2026-09-21.md`, gerada por
`pnpm infra:conferir-zona`. A catraca `scripts/infra/zona.test.mjs` impede o template de divergir
desta medição sem reprovar `pnpm check`.

Houve uma corrida anterior, em 2026-09-20, com os mesmos números. Ela saiu de um script cujas
guardas davam verde falso — nome inventado que voltasse a resolver na AWS contava como "sim", e
resposta `NS` vazia passava por delegação intacta —, então foi removida em vez de conviver com
esta: evidência que não sabe reprovar acaba lida como se soubesse. Ela continua no histórico, no
commit `537b8dd`.

## Conferência antes e depois da troca

A zona nova precisa responder **igual** à atual antes de a delegação mudar, porque durante a
propagação parte do mundo pergunta a um lado e parte ao outro. O apontamento para o CloudFront não
entra aqui — é `B5`.

```bash
# antes da troca: perguntar direto aos nameservers da AWS, sem depender da delegação
pnpm infra:conferir-zona

# depois da troca: recebimento real, não só resolução
# enviar uma mensagem de fora para uma caixa @lotusotec.cl e confirmar a entrega
```

Resolução correta **não** prova e-mail funcionando. O MX pode estar certo e a entrega falhar por
outro motivo; a prova de `B1` é mensagem recebida.

## Certificado

Desde 2026-09-26, o stack `lotus-dns` também declara o certificado ACM da zona, em `us-east-1`:

| Campo                     | Valor                  |
| ------------------------- | ---------------------- |
| `DomainName`              | `lotusotec.cl`         |
| `SubjectAlternativeNames` | `www.lotusotec.cl`     |
| `ValidationMethod`        | `DNS`                  |
| `Status`                  | `ISSUED`               |
| `NotAfter`                | `2027-04-11T23:59:59Z` |
| `RenewalEligibility`      | `INELIGIBLE`           |

A validação é DNS-01 com `HostedZoneId` apontando para a própria zona: o CloudFormation cria
sozinho um CNAME de validação por nome (`_….lotusotec.cl` e `_….www.lotusotec.cl`, apontando para
`acm-validations.aws`), e eles **ficam** na zona — é por eles que o ACM revalida a cada renovação.
Não entram no inventário, que é o que a StackDNS servia; a conferência só pergunta pelas linhas do
inventário, então não os acusa.

A validade é de 198 dias: é o teto que o ACM aplica a certificado público desde 2026-02-18, para
caber nos 200 dias do CA/Browser Forum. O plano esperava cerca de treze meses, o número de antes.

**A renovação ainda não é automática.** O ACM só renova sozinho certificado associado a outro
serviço da AWS, ou exportado; este não está em uso (`InUseBy` vazio), daí `INELIGIBLE`. Passa a
`ELIGIBLE` quando `B5` o ligar à distribuição. Se `B5` não acontecer antes de 2027-04-11, o
certificado expira sem renovar e o caminho é emitir outro — sem efeito no ar, porque nada o serve
até lá.

Em uso, a renovação é silenciosa, que é justamente o motivo de a `CAA` ser assunto de bloco próprio:
um `CAA` errado bloqueia a renovação sem aviso.

O ARN sai no output `ArnDoCertificado`. Ele é consumido por `B5` como **parâmetro** do stack do
site, não por `ImportValue`: o certificado é `us-east-1`, a distribuição é `sa-east-1`, e
CloudFormation não importa valor entre regiões.

**O certificado existe; ele ainda não é servido.** Nada o apresenta a um navegador enquanto a
distribuição não tiver `Aliases` e `ViewerCertificate` — isso é `B5`.
