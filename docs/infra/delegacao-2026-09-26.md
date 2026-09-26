# Delegação de `lotusotec.cl` para o Route 53 — 2026-09-26

> Evidência dos dois gates humanos do bloco `B1`. O que um comando podia provar está em
> `conferencia-zona-2026-09-26-pos-delegacao.md`; o que só uma pessoa podia provar está aqui.
>
> Horários em UTC, salvo quando marcados como do João (UTC-3).

## Antes

Nameservers no StackCP, registrados em print por João antes de qualquer mudança (tela **Nombres de
Servidor**, opção "Usar nombres de servidores personalizados"):

```text
ns1.stackdns.com   ns2.stackdns.com   ns3.stackdns.com   ns4.stackdns.com
```

O painel os listava fora de ordem (`ns2`, `ns1`, `ns4`, `ns3`); NS é conjunto, a ordem não conta.
São eles o rollback, e a zona da StackDNS continua de pé e respondendo até `B7`.

A conferência pré-troca é `conferencia-zona-2026-09-21-pre-delegacao.md`, rodada cinco dias antes da
troca. O intervalo não escondeu mudança: a conferência pós-delegação confere as mesmas 14 linhas.

## Depois

```text
ns-904.awsdns-49.net   ns-31.awsdns-03.com   ns-1889.awsdns-44.co.uk   ns-1507.awsdns-60.org
```

Troca feita por João no painel do StackCP; o aviso de "feito" chegou às 2026-09-26T01:12Z. O whois
do NIC Chile (`whois.nic.cl`, registrar Haulmer SpA) já listava os quatro às 01:13Z — é ele o
registro do valor gravado.

## Convergência

Medida por DNS-over-HTTPS contra `dns.google`, porque não há `dig` nesta máquina, e por consulta
direta aos servidores do `.cl`:

| Hora (UTC) | Servidores do `.cl` (`a`, `b`, `c.nic.cl`) | `dns.google`, 8 consultas por rodada |
| ---------- | ------------------------------------------ | ------------------------------------ |
| 01:13      | StackDNS, serial do `.cl` `2026092544`     | StackDNS                             |
| 01:35      | AWS nos três, TTL 3600                     | StackDNS                             |
| 02:07      | AWS                                        | 4 AWS, 4 StackDNS                    |
| 02:19      | AWS                                        | 6 AWS, 2 StackDNS                    |
| 02:24      | AWS                                        | 7 AWS, 1 StackDNS                    |
| 02:30      | AWS                                        | 8 AWS                                |
| 02:35      | AWS                                        | 8 AWS — estável                      |

A troca entrou no cadastro do registro na hora; a zona `.cl` publicada levou cerca de 20 minutos; o
cache anycast do `dns.google` levou mais uma hora para largar a resposta antiga. Às 02:25 a
Cloudflare (`cloudflare-dns.com`) já devolvia AWS em 4 de 4 consultas.

Leitura final, pelos comandos do plano:

```text
# medido em 2026-09-26T02:35:59Z
$ NS
ns-1507.awsdns-60.org.
ns-1889.awsdns-44.co.uk.
ns-31.awsdns-03.com.
ns-904.awsdns-49.net.
$ MX
1 aspmx.l.google.com.
10 alt3.aspmx.l.google.com.
10 alt4.aspmx.l.google.com.
5 alt1.aspmx.l.google.com.
5 alt2.aspmx.l.google.com.
$ TXT
v=spf1 include:_spf.google.com include:spf.stackmail.com -all
```

Os cinco MX do Google, sem sobra e sem falta, e o SPF idêntico ao inventário. A caixa baixa é a do
Route 53; a StackDNS servia em caixa alta, e DNS não distingue.

## Prova de entrega de e-mail

Resolução correta não prova entrega. O e-mail de `lotusotec.cl` tem duas metades, e elas se provam
separadamente.

### Saída e SPF — provado

- mensagem enviada por João de `jvandreoli@lotusotec.cl` para `jvbatalha32@gmail.com`, às 03:27 do
  João de 2026-09-26 (06:27Z), quase quatro horas depois da convergência;
- entregue em 1 segundo;
- "Mostrar original" no Gmail: `SPF: PASS com o IP 185.151.28.66`;
- mesmo quadro: `DMARC: 'FAIL'`, e nenhuma linha de DKIM — a mensagem saiu sem assinatura.

O `PASS` prova que o SPF atravessou a troca: o Gmail o avaliou lendo o Route 53. O `FAIL` de DMARC
não veio da troca. `_dmarc.lotusotec.cl` não existe em nenhum dos dois lados (medido direto em
`ns-904.awsdns-49.net` e `ns1.stackdns.com`), e a StackMail não assina com DKIM; a condição é a
mesma de antes, e o DMARC já é débito do backlog, com gatilho em `B2`.

**Correção do roteiro do plano.** O gate G2 mandava ler o `SPF` na mensagem _recebida_ numa caixa
`@lotusotec.cl`. Esse cabeçalho avalia o SPF do remetente externo, não o de `lotusotec.cl`. O SPF
deste domínio só se prova em mensagem que _sai_ dele, que é a desta secção.

### Entrada — pendente de confirmação humana

A primeira tentativa reprovou: mensagem de fora para `jvandreoli@lotusotec.cl` voltou com

```text
550 5.1.1 The email account that you tried to reach does not exist.
```

A causa não é a delegação. `jvandreoli@` foi criada no StackCP, isto é, na StackMail; o `MX` do
domínio aponta para o Google Workspace, onde essa conta não existe. Caixa criada na StackMail envia
mas nunca recebe, e isso já era verdade antes da troca: a StackDNS serve o mesmo `MX` (medido direto
em `ns1.stackdns.com` em 2026-09-26).

Para separar "o Google não aceita o domínio" de "a caixa não existe", o servidor de entrada do
Google foi consultado diretamente, com autorização de João — `EHLO`, `MAIL FROM:<>` e `RCPT TO`,
sem `DATA`, nenhuma mensagem enviada:

| Destinatário                       | `aspmx.l.google.com` respondeu |
| ---------------------------------- | ------------------------------ |
| `contacto@lotusotec.cl`            | `250 2.1.5 OK`                 |
| `ana@lotusotec.cl`                 | `550 5.1.1` (NoSuchUser)       |
| `zzz-nao-existe-8812@lotusotec.cl` | `550 5.1.1` (NoSuchUser)       |

O Google aceita correio para o domínio e reconhece `contacto@` como caixa real. Aceitação no `RCPT`
ainda não é entrega: a prova de entrada é a mensagem de fora chegando em `contacto@` e a resposta
voltando. João decidiu seguir o bloco sem esperar por ela; a confirmação, com o dono da caixa, entra
nesta secção quando for feita.

## Conferência pós-delegação

`conferencia-zona-2026-09-26-pos-delegacao.md`, gerado por
`pnpm infra:conferir-zona --pos-delegacao`: as 14 linhas do inventário conferem, os dois nomes
inventados não resolvem em lado nenhum — o wildcard não atravessou — e a linha `NS` mostra a
delegação já na AWS.

## O que continua de pé de propósito

A zona na StackDNS **não** foi apagada e sua remoção **não** foi pedida ao suporte. Ela é o
rollback, e o custo de mantê-la é zero. Desligá-la é `B7`, junto com o WordPress.
