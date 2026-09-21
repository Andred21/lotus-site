# Inventário da zona DNS de `lotusotec.cl`

> Medição, não configuração. Este arquivo registra o que a zona **responde hoje**, com data e
> método, para servir de base de conferência antes e depois da migração para o Route 53
> (`ADR-SITE-006`, bloco `B1`).
>
> Ele **não** substitui o export BIND. A secção "O que esta medição não pode saber" explica por quê.

## Método

Medido em **2026-09-09** por DNS-over-HTTPS contra `dns.google`, porque não há `dig` nesta máquina.
Reproduzir uma linha:

```bash
curl -s 'https://dns.google/resolve?name=lotusotec.cl&type=MX' | python3 -m json.tool
```

`type` aceita `A`, `AAAA`, `MX`, `TXT`, `NS`, `SOA`, `CNAME`, `CAA`.

## Delegação

```text
SOA  ns1.stackdns.com. hostmaster.stackdns.com. 1753989299 1800 900 1209600 300
NS   ns1.stackdns.com.   ns2.stackdns.com.   ns3.stackdns.com.   ns4.stackdns.com.
```

O painel é o Stack Control Panel (`https://www.stackcp.com/`), revenda da BlueHosting, onde o
domínio foi comprado. João confirmou em 2026-09-20 que recuperou o acesso (`D-44` fechado); o
export BIND continua pendente, e é ele que autoriza a troca.

## Apex

| Tipo   | TTL  | Valor                                                           |
| ------ | ---- | --------------------------------------------------------------- |
| `A`    | 3600 | `185.146.167.195`                                               |
| `AAAA` | 3600 | `2a07:7800::195`                                                |
| `MX`   | 3600 | `1 ASPMX.L.GOOGLE.COM.`                                         |
| `MX`   | 3600 | `5 ALT1.ASPMX.L.GOOGLE.COM.`                                    |
| `MX`   | 3600 | `5 ALT2.ASPMX.L.GOOGLE.COM.`                                    |
| `MX`   | 3600 | `10 ALT3.ASPMX.L.GOOGLE.COM.`                                   |
| `MX`   | 3600 | `10 ALT4.ASPMX.L.GOOGLE.COM.`                                   |
| `TXT`  | 3600 | `v=spf1 include:_spf.google.com include:spf.stackmail.com -all` |
| `CAA`  | —    | **não existe**                                                  |

`185.146.167.195` é o WordPress na BlueHosting. Os cinco MX são Google Workspace: é o e-mail
corporativo, e é o registro que mais exige conferência antes e depois da troca de nameserver.

Ausência de `CAA` é boa notícia: um CAA restritivo bloquearia a emissão do certificado pelo ACM.

## Wildcard

```text
*.lotusotec.cl.  A  185.146.167.195
```

Confirmado por dois nomes inventados, `zzz-nao-existe-19283` e `outro-teste-aleatorio-77`: os dois
respondem esse IP. É `D-45`.

## Subdomínios provadamente explícitos

Só estes cinco respondem algo **diferente** do wildcard, o que prova que existem como registro:

| Nome           | Tipo    | Valor                         | Serve                 |
| -------------- | ------- | ----------------------------- | --------------------- |
| `mail`         | `CNAME` | `ghs.googlehosted.com.`       | Google                |
| `smtp`         | `CNAME` | `smtp.stackmail.com.`         | provedor antigo       |
| `imap`         | `CNAME` | `imap.stackmail.com.`         | provedor antigo       |
| `autodiscover` | `CNAME` | `autodiscover.stackmail.com.` | descoberta de cliente |
| `ftp`          | `CNAME` | `ftp.us.stackcp.com.`         | painel                |

**`mail.lotusotec.cl` já está ocupado.** O MAIL FROM do SES não pode usar esse nome; a
`ADR-SITE-005` reserva `ses.lotusotec.cl`.

## Nomes indistinguíveis do wildcard

Respondem `A 185.146.167.195`, que é exatamente o que o wildcard responderia. **Não é possível
dizer, por DNS, se existem como registro ou se são o wildcard falando**: `www`, `webmail`, `pop`,
`cpanel`, `cpcalendars`, `cpcontacts`, `autoconfig`, `sistema`, `app`, `admin`, `api`, `portal`,
`aula`, `aulas`, `cursos`, `blog`, `dev`, `test`, `staging`, `intranet`, `crm`, `erp`, `lotus`,
`m`, `shop`, `tienda`, `calendar`, `drive`, `docs`, `_acme-challenge`.

Um contraste vale registrar: `smtp` e `imap` respondem CNAME para o `stackmail`, mas `pop` responde
o IP do apex. A leitura mais provável é que `pop` **não** está configurado e é o wildcard
respondendo — mas é leitura, não medição.

`sistema.lotusotec.cl` está nessa lista: hoje ele resolve, para o WordPress, só porque o wildcard
existe.

## Ausências medidas

| Registro                               | Estado         | Consequência                                       |
| -------------------------------------- | -------------- | -------------------------------------------------- |
| `_dmarc.lotusotec.cl` `TXT`            | **não existe** | e-mail sai sem política de alinhamento             |
| `google._domainkey.lotusotec.cl` `TXT` | **não existe** | Google Workspace envia sem assinatura DKIM         |
| `CAA` do apex                          | não existe     | ACM emite sem obstáculo                            |
| DNSSEC                                 | não existe     | troca de nameserver não quebra cadeia de confiança |

As duas primeiras são `D-46`. O `include:spf.stackmail.com` do SPF precisa de decisão junto: o MX é
Google, então esse include ou é resíduo do provedor antigo ou é caminho de envio ainda em uso — e
a diferença importa quando o SES entrar como remetente novo.

## O que esta medição não pode saber

**Quais registros existem sem que alguém pergunte pelo nome exato.** Com wildcard na zona, todo
palpite responde; sem wildcard, um nome não perguntado é simplesmente invisível. Transferência de
zona (`AXFR`) é recusada por qualquer servidor autoritativo sério, e a StackDNS não é exceção.

Por isso o **export BIND pedido ao suporte da BlueHosting é condição de `B1`**, não zelo: é a única
forma de afirmar "a cópia está completa" sem mentir. Enquanto ele não chegar, este arquivo é o piso
da conferência, não o teto.

## Cópia no Route 53

Desde 2026-09-20 a zona existe também no Route 53, criada pelo stack `lotus-dns`
(`infra/lotus-dns.yaml`, `us-east-1`), **sem delegação**: o registro `.cl` continua apontando para
`ns1..ns4.stackdns.com`, então este arquivo continua descrevendo o que o mundo lê.

A cópia tem duas diferenças deliberadas em relação ao que está medido acima:

- **não tem wildcard** — `www` e `sistema` viraram registro explícito no lugar dele;
- **não declara `NS` nem `SOA`** do apex, que a própria zona gera.

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
